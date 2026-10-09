# EV Charging Analytics — Demand, Cost & Driver Profiling

**Live Demo:** [ev-charging-analytics-koradee.streamlit.app](https://ev-charging-analytics-koradee.streamlit.app)



## What This Project Does

EV charging networks are not just physical infrastructure — they are pricing and logistics problems. This project analyses 1,320 real-format charging sessions to answer the questions a network operator actually asks: _When is demand highest? Which cities cost more? What kind of driver just plugged in, and what will this session cost?_

The output is an interactive Streamlit dashboard with two live ML models: a Random Forest that estimates session cost from pre-session inputs, and an XGBoost classifier that predicts driver type (Commuter / Casual Driver / Long-Distance Traveler) from session parameters.

## Who It's For

This is a **business analytics tool for EV charging network operators**, not a consumer app. The intended user is an analyst or product manager who wants to understand usage patterns, set dynamic pricing thresholds, or identify which driver segments to target with loyalty offers. The ML predictions are designed to support pre-session decisions — before energy, duration, and cost are known.

---

## Dataset

Source: `ev_charging_patterns.csv` (1,320 sessions, 20 raw columns).

Fields include vehicle model, battery capacity, charger type, station city (Chicago, LA, New York, San Francisco, Houston), timestamps, energy consumed, charging cost, SoC start/end, distance driven since last charge, ambient temperature, and labelled user type.

The dataset is synthetic and deliberately randomised — which means predictive accuracy is limited by design. The project focuses on engineering a clean, reproducible pipeline rather than chasing numbers on random data.

---

## Project Structure

```text
.
├── app/
│   └── app.py                          # Streamlit dashboard
├── data/
│   ├── raw/
│   │   └── ev_charging_patterns.csv    # Original, never modified
│   └── processed/
│       ├── ev_charging_cleaned.csv     # After cleaning (notebook 02)
│       └── ev_charging_features.csv    # After feature engineering (notebook 03)
├── notebooks/
│   ├── 01_data_understanding.ipynb
│   ├── 02_data_cleaning.ipynb
│   ├── 03_feature_engineering.ipynb
│   ├── 04_eda.ipynb
│   ├── 05_statistical_analysis.ipynb
│   ├── 06_model_building.ipynb
│   └── 07_model_evaluation.ipynb
├── reports/
│   ├── shap_cost_summary.png
│   ├── shap_user_summary.png
│   └── EV_Charging_Project_Summary.md
├── src/
│   └── models/
│       ├── best_cost_regressor.pkl
│       ├── best_user_classifier.pkl
│       └── user_type_encoder.pkl
├── README.md
├── requirements.txt
└── .gitignore
```

---

## Key Insights

1. **Afternoon peak is the expensive period.** Sessions in the Afternoon slot average **$23.13** and **43.3 kWh** — both highest of any time-of-day bucket. A peak-hour surcharge of even $2–3 per session would meaningfully shift total revenue without changing hardware.

2. **Chicago leads on price.** Average cost across the five cities ranges from \~$22 in San Francisco to **$23.72 in Chicago**. That gap is large enough to matter for station-placement decisions in expansion markets.

3. **Commuters arrive with the most-depleted batteries.** Commuters drive the farthest between charges (avg **159 km**), meaning they show up needing a near-full charge — they are the segment most sensitive to fast-charger availability and least price-elastic at point of need.

4. **DC Fast Charger pricing is backwards.** DC Fast Chargers show a lower average cost per kWh (**$0.96**) than Level 1 (**$1.60**) and Level 2 (**$2.25**). Since the faster charger should command a premium, this inversion is either a pricing mistake or a data artefact worth investigating with real network data.

5. **Session duration doesn't scale with charger speed.** All three charger types average **2.2–2.3 hours** per session. This suggests drivers plug in and walk away regardless of how fast the charger is — a strong case for idle fees to free up bays.

---

## Model Results

**Track A — Regression (predicting session cost)**

| Phase    | Model                    | RMSE  | MAE  | R²    |
|----------|--------------------------|-------|------|-------|
| Baseline | Linear Regression        | 11.13 | 9.35 | 0.012 |
| Tuned    | Random Forest Regressor  | 11.31 | 9.60 | 0.010 |

**Track B — Classification (predicting driver type)**

| Phase    | Model               | Accuracy | Weighted F1 |
|----------|---------------------|----------|-------------|
| Baseline | XGBoost Classifier  | 36.3%    | 0.364       |
| Tuned    | XGBoost Classifier  | 35.6%    | 0.354       |

**Honest note on performance:** The low R² and ~36% accuracy are a direct consequence of the synthetic dataset — the target variables are statistically independent of most features by construction. This is documented and expected. The value of the project is the end-to-end pipeline, the feature engineering decisions, and the interpretability work (SHAP), not the raw metrics.

---

## How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ev-charging-analytics.git
   cd ev-charging-analytics
   ```

2. **Run the setup script:**
   - **Windows:** Double-click `setup.bat` or run `.\setup.bat` in Command Prompt.
   - **Mac/Linux:** Run `bash setup.sh` in the terminal.

3. **Launch the Dashboard:**
   ```bash
   # Windows:
   .venv\Scripts\activate
   streamlit run app/app.py

   # Mac/Linux:
   source .venv/bin/activate
   streamlit run app/app.py
   ```

4. Open your browser to `http://localhost:8501`. That's it!

---

## Tech Stack

| Layer | Tools |
|---|---|
| Data wrangling | Python, Pandas, NumPy |
| Statistical testing | SciPy, Statsmodels |
| Machine learning | Scikit-Learn, XGBoost, SHAP |
| Visualisation | Matplotlib, Seaborn, Plotly |
| Dashboard | Streamlit, Joblib |
| Notebooks | Jupyter, nbconvert |

---

## What I'd Improve With More Time

- **Replace the synthetic dataset** with real sessions from the NREL EV Project or OpenChargeMap API. The model metrics would be meaningfully different — and likely much better.
- **Add a time-series demand forecast** (Prophet or a simple SARIMA) so operators can see projected load by hour, not just historical averages.
- **Build a proper pre-session feature set.** Right now the models were trained on post-session features (energy consumed, duration, SoC end) which aren't available at prediction time. A real production version would be trained exclusively on pre-session inputs and evaluated on held-out future sessions, not a random split.
- **Add an automated retraining trigger** (GitHub Actions or Prefect) so the models update when new session data is dropped into `/data/raw`.
