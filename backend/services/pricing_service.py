
class PricingService:
    def __init__(self):
        # Mock TOU Tariff: Peak 4pm-9pm (16-21)
        self.peak_rate = 0.35  # $/kWh
        self.off_peak_rate = 0.12 # $/kWh
        self.peak_hours = range(16, 21)

    def calculate_cost(self, energy_kwh, start_hour, duration_hours):
        """Calculate cost simulation for a session."""
        total_cost = 0
        current_hour = int(start_hour)
        hours_remaining = duration_hours

        while hours_remaining > 0:
            rate = self.peak_rate if (current_hour % 24) in self.peak_hours else self.off_peak_rate
            # Assume constant charging rate for simplicity
            energy_slice = energy_kwh * (min(1, hours_remaining) / duration_hours)
            total_cost += energy_slice * rate
            hours_remaining -= 1
            current_hour += 1
            
        return total_cost

    def optimize_charging_time(self, energy_kwh, duration_hours):
        """Find cheapest start time in next 24 hours."""
        costs = []
        for start_hour in range(24):
            cost = self.calculate_cost(energy_kwh, start_hour, duration_hours)
            costs.append({'start_hour': start_hour, 'cost': cost})
        
        best_slot = min(costs, key=lambda x: x['cost'])
        return {
            "recommended_start_hour": best_slot['start_hour'],
            "min_cost": round(best_slot['cost'], 2),
            "savings": round(max(c['cost'] for c in costs) - best_slot['cost'], 2),
            "all_slots": costs
        }
