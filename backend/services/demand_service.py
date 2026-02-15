
import pandas as pd
import numpy as np
import os

class DemandService:
    def __init__(self, csv_path=None):
        if csv_path is None:
            # Determine path based on current file location
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Assuming structure: backend/services/this_file.py
            # Project root is two levels up
            project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
            csv_path = os.path.join(project_root, 'ev_charging_patterns.csv')
            
        self.df = pd.read_csv(csv_path)
        self.df['Charging Start Time'] = pd.to_datetime(self.df['Charging Start Time'])
        self.df['Hour'] = self.df['Charging Start Time'].dt.hour
        self.df['DayOfWeek'] = self.df['Charging Start Time'].dt.day_name()

    def get_hourly_demand(self):
        """Aggregate historical data to forecast hourly demand."""
        hourly_stats = self.df.groupby('Hour')['Energy Consumed (kWh)'].agg(['mean', 'std', 'count']).reset_index()
        hourly_stats['lower_bound'] = hourly_stats['mean'] - hourly_stats['std']
        hourly_stats['upper_bound'] = hourly_stats['mean'] + hourly_stats['std']
        return hourly_stats.to_dict(orient='records')

    def get_daily_demand(self):
        """Aggregate historical data by day of week."""
        daily_stats = self.df.groupby('DayOfWeek')['Energy Consumed (kWh)'].mean().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ]).reset_index()
        return daily_stats.to_dict(orient='records')
