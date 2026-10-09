"""Adapters for the imported analytics data and completed-session models."""
from functools import lru_cache
from pathlib import Path
import joblib
import pandas as pd

ANALYTICS_ROOT = Path(__file__).resolve().parents[2] / 'analytics'
NOTICE = ('Educational models on synthetic data; predictive performance is limited. '
          'These models require completed-session measurements, not pre-session guesses.')
FIELDS = {
    'vehicle_model': 'Vehicle Model',
    'battery_capacity': 'Battery Capacity (kWh)',
    'location': 'Charging Station Location',
    'energy_consumed': 'Energy Consumed (kWh)',
    'charging_duration': 'Charging Duration (hours)',
    'charging_rate': 'Charging Rate (kW)',
    'time_of_day': 'Time of Day',
    'day_of_week': 'Day of Week',
    'soc_start': 'State of Charge (Start %)',
    'soc_end': 'State of Charge (End %)',
    'distance_driven': 'Distance Driven (since last charge) (km)',
    'temperature': 'Temperature (C)',
    'vehicle_age': 'Vehicle Age (years)',
    'charger_type': 'Charger Type',
    'start_hour': 'hour_of_day',
    'month': 'month',
    'soc_was_swapped': 'soc_was_swapped',
}
CATEGORIES = {
    'vehicle_model': 'Vehicle Model', 'location': 'Charging Station Location',
    'charger_type': 'Charger Type', 'user_type': 'User Type',
    'time_of_day': 'Time of Day', 'day_of_week': 'Day of Week',
}


@lru_cache(maxsize=1)
def load_data():
    return pd.read_csv(ANALYTICS_ROOT / 'data/processed/ev_charging_features.csv')


@lru_cache(maxsize=3)
def load_model(filename):
    return joblib.load(ANALYTICS_ROOT / 'src/models' / filename)


def metadata():
    df = load_data()
    first = df.iloc[0]
    example = {key: first[column].item() if hasattr(first[column], 'item') else first[column]
               for key, column in FIELDS.items()}
    example['soc_was_swapped'] = bool(example['soc_was_swapped'])
    example['user_type'] = first['User Type']
    example['charging_cost'] = float(first['Charging Cost (USD)'])
    return {'options': {key: sorted(df[column].dropna().unique().tolist())
                        for key, column in CATEGORIES.items()},
            'example': example, 'notice': NOTICE, 'total_sessions': len(df)}


def overview(location=None, charger_type=None, user_type=None):
    df = load_data()
    for value, column in [(location, 'Charging Station Location'),
                          (charger_type, 'Charger Type'), (user_type, 'User Type')]:
        if value is not None:
            df = df[df[column] == value]

    def grouped(column):
        result = df.groupby(column).agg(
            sessions=('Charging Cost (USD)', 'size'),
            avg_cost_usd=('Charging Cost (USD)', 'mean'),
            avg_energy_kwh=('Energy Consumed (kWh)', 'mean'),
        ).round(2).reset_index().rename(columns={column: 'name'})
        return result.to_dict(orient='records')

    return {
        'sessions': len(df),
        'avg_cost_usd': round(float(df['Charging Cost (USD)'].mean()), 2) if len(df) else None,
        'avg_energy_kwh': round(float(df['Energy Consumed (kWh)'].mean()), 2) if len(df) else None,
        'by_city': grouped('Charging Station Location'),
        'by_time_of_day': grouped('Time of Day'),
        'by_charger_type': grouped('Charger Type'),
        'by_driver_type': grouped('User Type'),
        'notice': NOTICE,
    }


def make_input_row(inputs, track):
    """Reproduce notebook 03 features without fabricating missing measurements."""
    row = {column: inputs[key] for key, column in FIELDS.items()}
    # Notebook cleaning uses title case; match the fitted encoder's categories.
    for column in ['Vehicle Model', 'Charging Station Location', 'Charger Type',
                   'Time of Day', 'Day of Week']:
        row[column] = row[column].strip().title()
    energy = inputs['energy_consumed']
    row.update({
        'soc_gained_pct': inputs['soc_end'] - inputs['soc_start'],
        'charging_efficiency': energy / inputs['charging_duration'],
        'battery_utilization_ratio': energy / inputs['battery_capacity'],
        'distance_per_kwh': inputs['distance_driven'] / energy,
        'is_weekend': int(row['Day of Week'] in ('Saturday', 'Sunday')),
        'charger_type_ordinal': {'Level 1': 1, 'Level 2': 2, 'Dc Fast Charger': 3}[row['Charger Type']],
    })
    if track == 'cost':
        row['User Type'] = inputs['user_type'].strip().title()
    else:
        row['Charging Cost (USD)'] = inputs['charging_cost']
        row['cost_per_kwh'] = inputs['charging_cost'] / energy
    return pd.DataFrame([row])


def predict_cost(inputs):
    model = load_model('best_cost_regressor.pkl')
    prediction = float(model.predict(make_input_row(inputs, 'cost'))[0])
    return {'estimated_cost_usd': max(0.0, round(prediction, 2)), 'notice': NOTICE}


def predict_driver(inputs):
    model = load_model('best_user_classifier.pkl')
    encoder = load_model('user_type_encoder.pkl')
    probabilities = model.predict_proba(make_input_row(inputs, 'driver'))[0]
    names = encoder.inverse_transform(model.classes_.astype(int))
    result = [{'profile': str(name), 'probability': float(probability)}
              for name, probability in zip(names, probabilities)]
    return {'driver_profile': max(result, key=lambda p: p['probability'])['profile'],
            'probabilities': result, 'notice': NOTICE}
