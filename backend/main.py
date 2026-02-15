
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import joblib
import uvicorn
import os
try:
    from backend.insights import (
        calculate_cost, 
        calculate_co2_savings, 
        get_peak_recommendation,
        get_temperature_recommendation,
        get_charger_type_info
    )
except ImportError:
    # Fallback if running directly inside backend/
    from insights import (
        calculate_cost, 
        calculate_co2_savings, 
        get_peak_recommendation,
        get_temperature_recommendation,
        get_charger_type_info
    )

# Import new routers
try:
    from backend.routers import forecasting, pricing, fleet, xai
except ImportError:
    from routers import forecasting, pricing, fleet, xai

app = FastAPI(title="EV Charging AI Platform 2026")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(forecasting.forecasting_router)
app.include_router(pricing.pricing_router)
app.include_router(fleet.fleet_router)
app.include_router(xai.xai_router)

# Load model and encoder
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # If running from backend directory directly, files are in current dir
    # If running from root, files are in backend/
    
    # Check if model.pkl exists in current dir
    if os.path.exists(os.path.join(current_dir, 'model.pkl')):
        model_path = os.path.join(current_dir, 'model.pkl')
        encoder_path = os.path.join(current_dir, 'encoder.pkl')
    else:
        # Fallback/Default assumption
        model_path = os.path.join(current_dir, 'model.pkl')
        encoder_path = os.path.join(current_dir, 'encoder.pkl')
        
    model = joblib.load(model_path)
    le = joblib.load(encoder_path)
except Exception as e:
    print(f"Error loading model/encoder: {e}")
    # Try alternate path for robustness (if running from root and accessing as backend/model.pkl)
    try:
        model = joblib.load('backend/model.pkl')
        le = joblib.load('backend/encoder.pkl')
    except:
        model = None
        le = None

class PredictionRequest(BaseModel):
    battery_capacity: float
    charging_duration: float
    charging_rate: float
    distance_driven: float
    temperature: float
    soc_start: float
    soc_end: float
    vehicle_age: float
    start_hour: int
    charger_type: str

class BatchPredictionRequest(BaseModel):
    requests: List[PredictionRequest]

@app.get("/")
def read_root():
    return {
        "message": "EV Charging AI Platform 2026 is online!",
        "version": "3.0",
        "modules": [
            "Predictive Analytics (RandomForest)",
            "Demand Forecasting (Time-Series Aggregation)",
            "Dynamic Pricing (TOU Optimization)",
            "Explainable AI (SHAP)",
            "Fleet Optimization (EDF Strategy)"
        ],
        "endpoints": [
            "/predict", "/batch-predict", 
            "/forecast/hourly", "/pricing/optimize", 
            "/fleet/optimize", "/xai/explain"
        ]
    }

@app.get("/stats")
def get_stats():
    """Get model and system statistics."""
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": "RandomForestRegressor",
        "n_estimators": 200,
        "features": [
            "Battery Capacity (kWh)",
            "Charging Duration (hours)",
            "Charging Rate (kW)",
            "Distance Driven (km)",
            "Temperature (°C)",
            "State of Charge (Start %)",
            "State of Charge (End %)",
            "Vehicle Age (years)",
            "Start Hour",
            "Charger Type"
        ],
        "charger_types": list(le.classes_) if le else [],
        "training_samples": 1254,
        "api_version": "3.0"
    }

@app.post("/predict")
def predict(request: PredictionRequest):
    if not model or not le:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Encode Charger Type
        if request.charger_type not in le.classes_:
             raise HTTPException(status_code=400, detail=f"Invalid Charger Type. Must be one of {list(le.classes_)}")
             
        charger_type_encoded = le.transform([request.charger_type])[0]
        
        # Prepare input DataFrame with correct column names matching training
        input_data = pd.DataFrame([{
            'Battery Capacity (kWh)': request.battery_capacity,
            'Charging Duration (hours)': request.charging_duration,
            'Charging Rate (kW)': request.charging_rate,
            'Distance Driven (since last charge) (km)': request.distance_driven,
            'Temperature (°C)': request.temperature,
            'State of Charge (Start %)': request.soc_start,
            'State of Charge (End %)': request.soc_end,
            'Vehicle Age (years)': request.vehicle_age,
            'Start Hour': request.start_hour,
            'Charger Type': charger_type_encoded
        }])
        
        prediction = model.predict(input_data)[0]
        
        # Calculate insights
        cost = calculate_cost(prediction)
        co2_saved = calculate_co2_savings(request.distance_driven, prediction)
        peak_rec = get_peak_recommendation(request.start_hour)
        temp_rec = get_temperature_recommendation(request.temperature)
        charger_info = get_charger_type_info(request.charger_type)
        
        return {
            "predicted_energy_consumed_kwh": prediction,
            "insights": {
                "estimated_cost_usd": round(cost, 2),
                "co2_saved_kg": round(co2_saved, 2),
                "charging_time_hours": round(prediction / request.charging_rate, 2)
            },
            "recommendations": {
                "peak_timing": peak_rec,
                "temperature": temp_rec,
                "charger_info": charger_info
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-predict")
def batch_predict(batch_request: BatchPredictionRequest):
    """Make predictions for multiple charging scenarios."""
    if not model or not le:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    results = []
    for req in batch_request.requests:
        try:
            result = predict(req)
            results.append({"success": True, "data": result})
        except Exception as e:
            results.append({"success": False, "error": str(e)})
    
    return {
        "total_requests": len(batch_request.requests),
        "successful": sum(1 for r in results if r.get("success")),
        "results": results
    }

@app.post("/recommendations")
def get_recommendations(request: PredictionRequest):
    """Get detailed recommendations without making a prediction."""
    peak_rec = get_peak_recommendation(request.start_hour)
    temp_rec = get_temperature_recommendation(request.temperature)
    charger_info = get_charger_type_info(request.charger_type)
    
    return {
        "peak_timing": peak_rec,
        "temperature": temp_rec,
        "charger_info": charger_info,
        "general_tips": [
            "Maintain your battery between 20-80% for optimal longevity",
            "Use scheduled charging to take advantage of off-peak rates",
            "Precondition your cabin while plugged in to save battery",
            "Regular software updates can improve charging efficiency"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
