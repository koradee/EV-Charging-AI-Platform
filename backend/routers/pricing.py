
from fastapi import APIRouter
from pydantic import BaseModel
from services.pricing_service import PricingService

pricing_router = APIRouter(tags=["Dynamic Pricing"])
pricing_service = PricingService()

class PricingRequest(BaseModel):
    energy_kwh: float
    duration_hours: float
    current_start_hour: int = 12

@pricing_router.post("/pricing/optimize")
def get_pricing_optimization(request: PricingRequest):
    """
    Simulate cost for the charging session and recommend cheaper times.
    """
    result = pricing_service.optimize_charging_time(
        request.energy_kwh, 
        request.duration_hours
    )
    
    current_cost = pricing_service.calculate_cost(
        request.energy_kwh, 
        request.current_start_hour, 
        request.duration_hours
    )
    
    return {
        "current_estimated_cost": round(current_cost, 2),
        "optimal_scenario": result,
        "tariff_info": {
            "peak_rate": pricing_service.peak_rate,
            "off_peak_rate": pricing_service.off_peak_rate,
            "peak_hours": "16:00 - 21:00"
        }
    }
