
from fastapi import APIRouter
from pydantic import BaseModel
from services.xai_service import XAIService
import pandas as pd # Needed for DF conversion in service

xai_router = APIRouter(tags=["Explainable AI"])
# Lazy init in real app, here simple init
xai_service = XAIService() 

# Redefine PredictionRequest to match main app or import common model
# For modularity, redefining relevant subset
class XAIRequest(BaseModel):
    battery_capacity: float
    charging_duration: float
    charging_rate: float
    distance_driven: float
    temperature: float
    soc_start: float
    soc_end: float
    vehicle_age: float
    start_hour: int
    charger_type_encoded: int # Expect encoded for simplicity in XAI service interaction

@xai_router.post("/xai/explain")
def explain_prediction(request: XAIRequest):
    """
    Generate SHAP feature importance for a specific input scenario.
    """
    # Convert request to DF matching model columns
    input_df = pd.DataFrame([{
        'Battery Capacity (kWh)': request.battery_capacity,
        'Charging Duration (hours)': request.charging_duration,
        'Charging Rate (kW)': request.charging_rate,
        'Distance Driven (since last charge) (km)': request.distance_driven,
        'Temperature (°C)': request.temperature,
        'State of Charge (Start %)': request.soc_start,
        'State of Charge (End %)': request.soc_end,
        'Vehicle Age (years)': request.vehicle_age,
        'Start Hour': request.start_hour,
        'Charger Type': request.charger_type_encoded
    }])
    
    explanation = xai_service.get_explanation(input_df)
    return {
        "explanation": explanation,
        "method": "SHAP (TreeExplainer)"
    }
