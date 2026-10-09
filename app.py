"""Vercel entry point: serve the React build and Python API on one origin."""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from backend import main as backend
from backend.services import analytics_service

app = FastAPI(title='EV Charging Platform', docs_url=None, redoc_url=None, openapi_url=None)
logger = logging.getLogger(__name__)


@app.get('/healthz')
def readiness():
    """Check inference artifacts, not just whether the HTTP process is alive."""
    try:
        if backend.model is None or backend.le is None:
            raise RuntimeError('Energy model or encoder unavailable')
        if analytics_service.load_data().empty:
            raise RuntimeError('Analytics dataset is empty')
        for filename in ('best_cost_regressor.pkl', 'best_user_classifier.pkl', 'user_type_encoder.pkl'):
            analytics_service.load_model(filename)
    except Exception as exc:
        logger.exception('Deployment readiness failed')
        raise HTTPException(status_code=503, detail='Model or dataset unavailable; inspect deployment logs.') from exc
    return {'status': 'ready', 'energy_model': True, 'analytics_models': True}


# Declare API before the static mount so unknown API paths remain JSON 404s.
app.mount('/api', backend.app)
# Vercel's FastAPI runtime promotes mounted static files to its CDN.
# check_dir=False allows inspection before the frontend build exists.
app.mount('/', StaticFiles(directory='frontend/dist', html=True, check_dir=False), name='frontend')
