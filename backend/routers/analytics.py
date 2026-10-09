"""Network analytics and completed-session model endpoints."""
from typing import Literal
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
try:
    from backend.services import analytics_service as service
except ModuleNotFoundError:
    from services import analytics_service as service

analytics_router = APIRouter(prefix='/analytics', tags=['Network Analytics'])
logger = logging.getLogger(__name__)


class SessionRequest(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra='forbid')
    vehicle_model: str = Field(min_length=1)
    location: str = Field(min_length=1)
    battery_capacity: float = Field(gt=0)
    energy_consumed: float = Field(gt=0)
    charging_duration: float = Field(gt=0)
    charging_rate: float = Field(gt=0)
    time_of_day: Literal['Morning', 'Afternoon', 'Evening', 'Night']
    day_of_week: Literal['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    soc_start: float = Field(ge=0, le=100)
    soc_end: float = Field(ge=0, le=100)
    distance_driven: float = Field(ge=0)
    temperature: float
    vehicle_age: float = Field(ge=0)
    charger_type: Literal['Level 1', 'Level 2', 'Dc Fast Charger', 'DC Fast Charger']
    start_hour: int = Field(ge=0, le=23)
    month: int = Field(ge=1, le=12)
    soc_was_swapped: bool = False


class CostRequest(SessionRequest):
    user_type: Literal['Commuter', 'Casual Driver', 'Long-Distance Traveler']


class DriverRequest(SessionRequest):
    charging_cost: float = Field(ge=0)


def run(operation, *args, **kwargs):
    try:
        return operation(*args, **kwargs)
    except Exception as exc:
        logger.exception('Analytics operation failed')
        raise HTTPException(status_code=503, detail=(
            'Analytics data or model unavailable. Check installed dependencies and '
            'the analytics/data and analytics/src/models files; see docs/INTEGRATION.md.'
        )) from exc


@analytics_router.get('/metadata')
def metadata():
    return run(service.metadata)


@analytics_router.get('/overview')
def overview(location: str = None, charger_type: str = None, user_type: str = None):
    return run(service.overview, location, charger_type, user_type)


def validate_categories(request):
    options = run(service.metadata)['options']
    for key in ('vehicle_model', 'location'):
        if getattr(request, key).strip().title() not in options[key]:
            raise HTTPException(status_code=422, detail=f'Unknown {key}; choose from /analytics/metadata.')


@analytics_router.post('/predict-cost')
def predict_cost(request: CostRequest):
    validate_categories(request)
    return run(service.predict_cost, request.model_dump())


@analytics_router.post('/predict-driver')
def predict_driver(request: DriverRequest):
    validate_categories(request)
    return run(service.predict_driver, request.model_dump())
