"""Integration checks against the imported datasets and serialized models."""
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services import analytics_service as service

client = TestClient(app)


def payload(track):
    example = service.metadata()['example'].copy()
    example.pop('charging_cost' if track == 'cost' else 'user_type')
    return example


def test_overview_filters_all_summaries():
    df = service.load_data()
    result = client.get('/analytics/overview', params={'location': 'Houston', 'user_type': 'Commuter'})
    assert result.status_code == 200
    expected = df[(df['Charging Station Location'] == 'Houston') & (df['User Type'] == 'Commuter')]
    body = result.json()
    assert body['sessions'] == len(expected)
    assert body['avg_cost_usd'] == round(expected['Charging Cost (USD)'].mean(), 2)
    assert sum(item['sessions'] for item in body['by_charger_type']) == len(expected)
    assert [item['name'] for item in body['by_driver_type']] == ['Commuter']


def test_empty_filter_has_no_nan_or_fake_metrics():
    result = client.get('/analytics/overview', params={'location': 'No such city'})
    assert result.status_code == 200
    assert result.json()['sessions'] == 0
    assert result.json()['avg_cost_usd'] is None
    assert result.json()['by_city'] == []


def test_engineered_inputs_match_notebook_data():
    df = service.load_data()
    # Exercise all charger categories, weekdays/weekends and cleaned SoC rows.
    selected = pd.concat([df.groupby('Charger Type').head(1), df[df.is_weekend == 1].head(1),
                          df[df.soc_was_swapped == 1].head(1)])
    for _, source in selected.iterrows():
        inputs = {key: source[column] for key, column in service.FIELDS.items()}
        inputs.update(user_type=source['User Type'], charging_cost=source['Charging Cost (USD)'])
        for track in ['cost', 'driver']:
            actual = service.make_input_row(inputs, track).iloc[0]
            for column, value in actual.items():
                if isinstance(value, str):
                    assert value == source[column]
                else:
                    assert value == pytest.approx(source[column])
            assert ('Charging Cost (USD)' not in actual) if track == 'cost' else ('User Type' not in actual)


@pytest.mark.parametrize('track', ['cost', 'driver'])
def test_real_model_predictions_match_saved_pipeline(track):
    result = client.post(f'/analytics/predict-{track}', json=payload(track))
    assert result.status_code == 200, result.text
    body = result.json()
    df = service.load_data().iloc[[0]]
    if track == 'cost':
        model = service.load_model('best_cost_regressor.pkl')
        expected = max(0, round(float(model.predict(df)[0]), 2))
        assert body['estimated_cost_usd'] == expected
    else:
        model = service.load_model('best_user_classifier.pkl')
        encoder = service.load_model('user_type_encoder.pkl')
        expected = encoder.inverse_transform(model.predict(df).astype(int))[0]
        assert body['driver_profile'] == expected
        assert sum(item['probability'] for item in body['probabilities']) == pytest.approx(1, abs=1e-6)
        assert [item['probability'] for item in body['probabilities']] == pytest.approx(model.predict_proba(df)[0])


@pytest.mark.parametrize('key,value', [('energy_consumed', 0), ('charging_duration', 0),
    ('battery_capacity', 0), ('month', 13), ('start_hour', 24), ('soc_end', 101),
    ('charger_type', 'unknown'), ('location', 'unknown'), ('temperature', 'NaN')])
def test_invalid_session_is_rejected(key, value):
    data = payload('cost'); data[key] = value
    assert client.post('/analytics/predict-cost', json=data).status_code == 422


def test_unknown_measurement_cannot_be_silently_zero_filled():
    data = payload('cost'); del data['energy_consumed']
    assert client.post('/analytics/predict-cost', json=data).status_code == 422


def test_unavailable_model_returns_actionable_error(monkeypatch):
    def unavailable(_):
        raise FileNotFoundError('model absent')
    monkeypatch.setattr(service, 'load_model', unavailable)
    result = client.post('/analytics/predict-cost', json=payload('cost'))
    assert result.status_code == 503
    assert 'docs/INTEGRATION.md' in result.json()['detail']


def test_existing_energy_and_demand_modules_still_work():
    params = dict(battery_capacity=75, charging_duration=2.5, charging_rate=25,
                  distance_driven=150, temperature=20, soc_start=30, soc_end=80,
                  vehicle_age=3, start_hour=12, charger_type='Level 2')
    result = client.post('/predict', json=params)
    assert result.status_code == 200, result.text
    assert np.isfinite(result.json()['predicted_energy_consumed_kwh'])
    assert client.get('/health').json()['model_loaded']
    assert len(client.get('/forecast/hourly').json()) == 24
    assert len(client.get('/forecast/daily').json()) == 7
    assert client.post('/pricing/optimize', json={'energy_kwh': 40, 'duration_hours': 3}).status_code == 200
    assert client.post('/fleet/optimize', json={'vehicles': []}).status_code == 200
    params.pop('charger_type'); params['charger_type_encoded'] = 1
    result = client.post('/xai/explain', json=params)
    assert result.status_code == 200, result.text
    assert len(result.json()['explanation']) == 10
