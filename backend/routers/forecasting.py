
from fastapi import APIRouter
try:
    from backend.services.demand_service import DemandService
except ModuleNotFoundError:
    from services.demand_service import DemandService

# Initialize once (loads CSV)
demand_service = DemandService() 
forecasting_router = APIRouter(tags=["Forecasting"])

@forecasting_router.get("/forecast/hourly")
def get_hourly_forecast():
    """
    Return aggregated hourly demand profile derived from historical data.
    Acts as a forecast baseline.
    """
    return demand_service.get_hourly_demand()

@forecasting_router.get("/forecast/daily")
def get_daily_forecast():
    """
    Return aggregated daily demand profile.
    """
    return demand_service.get_daily_demand()
