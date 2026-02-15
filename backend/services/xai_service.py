
import shap
import pandas as pd
import joblib
import numpy as np
import os

class XAIService:
    def __init__(self, model_path=None, train_data_path=None):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
        
        if model_path is None:
             # Try to find model in backend/ directory
             model_path = os.path.join(project_root, 'backend', 'model.pkl')
        
        if train_data_path is None:
             train_data_path = os.path.join(project_root, 'ev_charging_patterns.csv')

        self.model = joblib.load(model_path)
        # Load and preprocess sample background data for SHAP
        # In production, save/load explainer object directly for speed
        df = pd.read_csv(train_data_path).dropna(subset=['Energy Consumed (kWh)'])
        
        # Keep consistent with training features
        self.feature_names = [
            'Battery Capacity (kWh)', 'Charging Duration (hours)', 'Charging Rate (kW)',
            'Distance Driven (since last charge) (km)', 'Temperature (°C)',
            'State of Charge (Start %)', 'State of Charge (End %)',
            'Vehicle Age (years)', 'Start Hour', 'Charger Type'
        ]
        
        # Simple preprocessing for background data (numeric only for speed demo)
        # Real implementation needs full pipeline
        # Using TreeExplainer which is fast for Random Forest
        
        # Placeholder: Re-initialize explainer on request or singleton
        # For efficiency in this demo, we'll create explainer on first call or keep it lightweight
        self.explainer = None 

    def get_explanation(self, input_data):
        """
        Generate feature importance for a single prediction.
        input_data: DataFrame with single row matching model features
        """
        if not self.explainer:
             # creating a lightweight explainer
             # In robust system, load pre-computed explainer
             self.explainer = shap.TreeExplainer(self.model)
        
        shap_values = self.explainer.shap_values(input_data)
        
        # Format for frontend: List of {feature: name, impact: value}
        explanation = []
        for i, feat in enumerate(self.feature_names):
            explanation.append({
                "feature": feat,
                "impact": float(shap_values[0][i]),
                "value": float(input_data.iloc[0, i])
            })
            
        # Sort by absolute impact
        explanation.sort(key=lambda x: abs(x['impact']), reverse=True)
        return explanation
