# EV Charging AI & Analytics Platform

One React/FastAPI application combining [EV-Charging-AI-Platform](https://github.com/koradee/EV-Charging-AI-Platform) and [ev-charging-analytics](https://github.com/koradee/ev-charging-analytics).

Explore network usage, estimate energy and session cost, classify driver profiles, simulate charging tariffs, and experiment with fleet scheduling and SHAP explanations. The analytics research, notebooks, reports, Streamlit app, and saved models are included under `analytics/` with the original Git history preserved in a portable bundle.

## Modules

| Tab | Capability |
| --- | --- |
| Predict | Existing Random Forest energy model and prediction history |
| Analytics | Filtered network KPIs and charts; cost regression and driver classification |
| Forecast | Historical hourly and weekday energy averages |
| Pricing | Time-of-use tariff simulation and charging-window comparison |
| Fleet | Existing experimental fleet scheduling demonstration |
| Explainability | SHAP explanations for the energy model |

## Deploy on Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) to deploy the dashboard and Python API together. Import the **repository root** with the FastAPI preset and enable Large Functions; importing only `frontend/` does not deploy the ML models.

## Run locally

Use **Python 3.12** and **Node.js 22.12+**.

```bash
git clone https://github.com/koradee/EV-Charging-AI-Platform.git
cd EV-Charging-AI-Platform
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. API documentation is at `http://127.0.0.1:8000/docs`.
For a separate backend host, set `VITE_API_URL` in `frontend/.env` before starting or building the frontend and add that frontend origin to `allowed_origins` in `backend/main.py`.

### Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`; API: `http://localhost:8000`.
The backend image includes the analytics data/models and XGBoost's OpenMP runtime.

## Analytics workflow

1. Open **Analytics** and filter by city, charger type, or driver type. KPIs and all four charts use the same filtered rows.
2. Scroll to **Completed-session model explorer**. The initial values are an example from the synthetic dataset.
3. Enter measured session data. Choose **Predict session cost** with a known driver type, or **Classify driver profile** with a known session cost.
4. Read the cost estimate or the three driver probabilities. These are educational outputs with limited predictive performance.

## Data and model limitations

Both repositories contain the **same 1,320-row synthetic raw dataset**. The integration does not concatenate those copies or count them as separate sessions. Analytics uses its cleaned, engineered 1,320-row data; the existing energy pipeline retains its own missing-value handling.

The shipped cost and driver pipelines require post-session measurements (including energy, duration, and ending state of charge). The new API requires those values, reproduces notebook feature engineering, and does not zero-fill unknown outcomes. The cost model takes known driver type; the driver model takes known charging cost. Neither is a validated pre-session prediction service.

The original analytics README reports approximately 0.01 R² for cost and 36% driver accuracy. These are historical reported metrics, not new evaluations from this integration. Synthetic observations do not establish real-world pricing or driver-behavior conclusions.

The Forecast tab shows historical aggregation, not a trained future time-series forecast. Pricing uses assumed tariffs. The inherited fleet demonstration does not enforce its advertised grid-capacity limit and is not an operational scheduler.

The preserved serialized models emit version-compatibility warnings for the older energy model and XGBoost artifact. Integration tests exercise inference in the pinned environment, but production use requires retraining/exporting all models in one supported environment and independent validation. See [integration details](docs/INTEGRATION.md).

## Repository layout

```text
backend/                 FastAPI, energy model, service adapters, routers
frontend/                React application with six tabs
analytics/
  app/                   Original Streamlit research interface
  data/raw/              Original synthetic CSV
  data/processed/        Cleaned and engineered datasets
  notebooks/             Seven research notebooks
  reports/               Research summaries and SHAP figures
  src/models/            Cost, driver, and label-encoder artifacts
tests/                   API, feature parity, and model integration checks
docs/INTEGRATION.md       Provenance, API contracts, and limitations
```

To run the preserved Streamlit interface, install `analytics/requirements.txt` in a separate environment and run `streamlit run analytics/app/app.py`. Its original pre-session forms remain a legacy research demonstration; use the combined Analytics tab for measured inputs. Run the notebooks with `analytics/notebooks` as the working directory. Notebook 06 and notebook 07 use different feature selections, and notebook 07 overwrites the saved models; review that research sequence before retraining.

## API additions

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/analytics/metadata` | Categories, sample inputs, dataset size and limitations |
| GET | `/analytics/overview` | Filtered metrics and grouped chart data |
| POST | `/analytics/predict-cost` | Completed-session cost estimate |
| POST | `/analytics/predict-driver` | Driver label and class probabilities |

All original routes remain available. See `/docs` for full request schemas.

## Verification

```bash
pip install -r requirements-dev.txt
cd frontend
VITE_API_URL=/api npm run build
npx eslint src/components/AnalyticsPage.jsx
cd ..
python -m pytest tests -q
```

The tests cover imported model inference, notebook feature parity, filtered aggregation, invalid inputs, missing model handling, and existing energy/demand/pricing/fleet/SHAP routes.
