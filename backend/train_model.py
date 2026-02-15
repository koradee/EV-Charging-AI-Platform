
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Create backend directory if not exists (though we are running this inside backend/ usually)
if not os.path.exists('backend'):
    os.makedirs('backend', exist_ok=True)

print("Loading data...")
df = pd.read_csv('ev_charging_patterns.csv')

# Preprocessing steps from notebook
print("Preprocessing...")
df = df.dropna(subset=['Energy Consumed (kWh)'])

numeric_cols = [
    'Charging Rate (kW)',
    'Distance Driven (since last charge) (km)'
]
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

df['Charging Start Time'] = pd.to_datetime(df['Charging Start Time'])
df['Start Hour'] = df['Charging Start Time'].dt.hour

# Label Encoding for Charger Type
le = LabelEncoder()
df['Charger Type'] = le.fit_transform(df['Charger Type'])

# Feature Selection
X = df[[
    'Battery Capacity (kWh)',
    'Charging Duration (hours)',
    'Charging Rate (kW)',
    'Distance Driven (since last charge) (km)',
    'Temperature (°C)',
    'State of Charge (Start %)',
    'State of Charge (End %)',
    'Vehicle Age (years)',
    'Start Hour',
    'Charger Type'
]]

y = df['Energy Consumed (kWh)']

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model Training
print("Training model...")
model = RandomForestRegressor(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

# Save artifacts
print("Saving artifacts...")
joblib.dump(model, 'backend/model.pkl')
joblib.dump(le, 'backend/encoder.pkl')

print("Done! Model and encoder saved to backend/ directory.")
