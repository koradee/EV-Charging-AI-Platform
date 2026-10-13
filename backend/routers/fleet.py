"""Demonstration fleet scheduler with an hourly shared grid-capacity limit."""
from math import ceil
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator


CHARGER_POWER_KW = 7.2


class FleetVehicle(BaseModel):
    id: str = Field(min_length=1)
    arrival_hour: int = Field(ge=0, le=23)
    departure_hour: int = Field(ge=1, le=24)
    energy_needed_kwh: float = Field(gt=0)

    @model_validator(mode="after")
    def valid_window(self):
        if self.departure_hour <= self.arrival_hour:
            raise ValueError("departure_hour must be after arrival_hour (same day)")
        return self


class FleetRequest(BaseModel):
    vehicles: List[FleetVehicle]
    max_grid_capacity: float = Field(default=100.0, gt=0, allow_inf_nan=False)


fleet_router = APIRouter(tags=["Fleet Optimization"])


@fleet_router.post("/fleet/optimize")
def optimize_fleet(request: FleetRequest):
    """Earliest-departure-first, first feasible contiguous hourly charging slot.

    Assumes one 7.2 kW charger per vehicle and whole-hour reservations.
    Each reserved hour is conservatively counted at the full charger power,
    even if the final hour uses less energy. No overnight sessions.
    """
    schedule = []
    current_grid_load = {hour: 0.0 for hour in range(24)}

    for vehicle in sorted(request.vehicles, key=lambda v: v.departure_hour):
        duration = ceil(vehicle.energy_needed_kwh / CHARGER_POWER_KW)
        assigned_start = -1

        for start in range(vehicle.arrival_hour, vehicle.departure_hour - duration + 1):
            hours = range(start, start + duration)
            if all(current_grid_load[h] + CHARGER_POWER_KW <= request.max_grid_capacity + 1e-9 for h in hours):
                assigned_start = start
                for h in hours:
                    current_grid_load[h] += CHARGER_POWER_KW
                break

        schedule.append({
            "vehicle_id": vehicle.id,
            "status": "Scheduled" if assigned_start >= 0 else "Impossible",
            "assigned_start_hour": assigned_start,
            "duration": duration,
        })

    return {
        "schedule": schedule,
        "strategy": "Earliest Departure First (EDF)",
        "vehicles_count": len(request.vehicles),
    }
