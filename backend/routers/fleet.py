
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

class FleetVehicle(BaseModel):
    id: str
    arrival_hour: int
    departure_hour: int
    energy_needed_kwh: float

class FleetRequest(BaseModel):
    vehicles: List[FleetVehicle]
    max_grid_capacity: float = 100.0

fleet_router = APIRouter(tags=["Fleet Optimization"])

@fleet_router.post("/fleet/optimize")
def optimize_fleet(request: FleetRequest):
    """
    Simulate optimal charging schedule for multiple vehicles.
    Simple greedy strategy prioritizing earliest departure.
    """
    schedule = []
    # Simple sort by departure time (earliest first)
    sorted_vehicles = sorted(request.vehicles, key=lambda v: v.departure_hour)
    
    current_grid_load = {h: 0.0 for h in range(24)}
    
    for vehicle in sorted_vehicles:
        assigned = False
        duration_needed = int(vehicle.energy_needed_kwh / 7.2) # Assume 7.2kW L2 charger
        if duration_needed < 1: duration_needed = 1
        
        # Try to find a window
        # Strategy: Search backwards from departure to find latest possible start 
        # (Just-in-Time charging is grid friendly if not peak)
        
        best_start = vehicle.arrival_hour
        
        # Simple Logic: Start immediately if possible
        # Real logic would check capacity
        start = vehicle.arrival_hour
        if start + duration_needed > vehicle.departure_hour:
             # Impossible schedule
             status = "Impossible"
             real_start = -1
        else:
             status = "Scheduled"
             real_start = start
             # Update grid load
             for h in range(real_start, real_start + duration_needed):
                 if h < 24: current_grid_load[h] += 7.2
        
        schedule.append({
            "vehicle_id": vehicle.id,
            "status": status,
            "assigned_start_hour": real_start,
            "duration": duration_needed
        })

    return {
        "schedule": schedule,
        "strategy": "Earliest Departure First (EDF)",
        "vehicles_count": len(request.vehicles)
    }
