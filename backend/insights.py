"""
Helper module for generating insights and recommendations
for EV charging predictions.
"""

def calculate_cost(energy_kwh, cost_per_kwh=0.13):
    """Calculate charging cost based on energy consumed."""
    return energy_kwh * cost_per_kwh

def calculate_co2_savings(distance_driven_km, energy_kwh):
    """
    Calculate CO2 savings compared to gasoline vehicle.
    
    Assumptions:
    - Gasoline car emits ~2.3 kg CO2 per km
    - Grid electricity emits ~0.411 kg CO2 per kWh
    """
    gas_car_emissions = distance_driven_km * 2.3
    ev_emissions = energy_kwh * 0.411
    return gas_car_emissions - ev_emissions

def get_peak_recommendation(start_hour):
    """Provide recommendation based on time of day."""
    if 22 <= start_hour or start_hour <= 6:
        return {
            "is_optimal": True,
            "message": "Great choice! Charging during off-peak hours saves money and reduces grid stress.",
            "tip": "Off-peak rates can be 30-50% cheaper than peak hours."
        }
    elif 6 < start_hour < 10 or 17 < start_hour < 22:
        return {
            "is_optimal": False,
            "message": "You're charging during peak hours. Consider shifting to off-peak times (10 PM - 6 AM).",
            "tip": "Peak hours have higher electricity rates and increased grid demand."
        }
    else:
        return {
            "is_optimal": True,
            "message": "Good timing! Mid-day charging is reasonable, especially with solar power.",
            "tip": "If you have solar panels, daytime charging maximizes self-consumption."
        }

def get_temperature_recommendation(temperature):
    """Provide recommendation based on temperature."""
    if temperature < 0:
        return {
            "impact": "high",
            "message": "Cold weather significantly reduces battery efficiency.",
            "tip": "Precondition your battery while plugged in to improve efficiency."
        }
    elif 0 <= temperature < 15:
        return {
            "impact": "moderate",
            "message": "Cool temperatures may slightly reduce charging efficiency.",
            "tip": "Parking in a garage can help maintain optimal battery temperature."
        }
    elif 15 <= temperature <= 25:
        return {
            "impact": "optimal",
            "message": "Ideal temperature range for battery performance.",
            "tip": "Your battery will charge efficiently at this temperature."
        }
    else:
        return {
            "impact": "moderate",
            "message": "High temperatures can affect battery longevity.",
            "tip": "Avoid leaving your EV in direct sunlight when possible."
        }

def get_charger_type_info(charger_type):
    """Provide information about charger type."""
    info = {
        "Level 1": {
            "power": "1.4-1.9 kW",
            "typical_time": "8-20 hours for full charge",
            "best_for": "Overnight charging at home",
            "cost": "Lowest installation cost"
        },
        "Level 2": {
            "power": "3.3-19.2 kW",
            "typical_time": "3-8 hours for full charge",
            "best_for": "Home and public charging",
            "cost": "Moderate installation cost"
        },
        "DC Fast Charger": {
            "power": "50-350 kW",
            "typical_time": "20-60 min for 80% charge",
            "best_for": "Long trips and quick top-ups",
            "cost": "Highest per-kWh cost"
        }
    }
    return info.get(charger_type, {})
