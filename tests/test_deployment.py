"""Exercise the actual Vercel ASGI entry point after a frontend build."""
from pathlib import Path
from fastapi.testclient import TestClient
from app import app
from backend.services import analytics_service

client = TestClient(app)


def test_built_frontend_and_api_share_one_origin():
    page = client.get('/')
    assert page.status_code == 200
    assert 'text/html' in page.headers['content-type']
    assert '<div id="root">' in page.text
    assert client.get('/healthz').json()['status'] == 'ready'
    assert client.get('/api/analytics/metadata').json()['total_sessions'] == 1320
    assert client.get('/api/health').json()['model_loaded'] is True
    docs = client.get('/api/docs')
    assert docs.status_code == 200
    assert '/api/openapi.json' in docs.text
    assert client.get('/api/does-not-exist').status_code == 404
    assert client.get('/api/does-not-exist').headers['content-type'] == 'application/json'
    for asset in Path('frontend/dist/assets').glob('*'):
        assert client.get('/assets/' + asset.name).status_code == 200


def test_both_models_work_behind_api_prefix():
    example = analytics_service.metadata()['example']
    for track, excluded in [('cost', 'charging_cost'), ('driver', 'user_type')]:
        data = {key: value for key, value in example.items() if key != excluded}
        response = client.post('/api/analytics/predict-' + track, json=data)
        assert response.status_code == 200, response.text


def test_readiness_reports_missing_models(monkeypatch):
    def missing(_):
        raise FileNotFoundError('missing model')
    monkeypatch.setattr(analytics_service, 'load_model', missing)
    assert client.get('/healthz').status_code == 503
