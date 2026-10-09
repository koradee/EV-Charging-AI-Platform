# Combining the two EV projects

## Provenance and structure

- Base: `koradee/EV-Charging-AI-Platform` at `33be85d5f950c5a5e00d9e28d4175e08cac12360`.
- Imported source: `koradee/ev-charging-analytics` at `f64d0d192b95143a68de407771b8d41a1cff4222`.
- The published integration commit imports the complete analytics tree under `analytics/`. The original analytics commit history is preserved in `docs/analytics-source-history.bundle` because the connected GitHub API cannot attach a parent commit from an unrelated repository.
- Restore that original history with `git clone docs/analytics-source-history.bundle analytics-history`, or inspect it with `git bundle list-heads docs/analytics-source-history.bundle`. The source commit identifiers above remain unchanged inside the bundle.
- The source repositories are not deleted, archived, renamed, or overwritten by this branch.
- Within the imported source, the Streamlit entry point only gains working-directory-independent paths and a visible legacy-model notice. Research notebooks, reports, datasets, and model binaries are preserved unchanged.

The two raw CSV copies are byte-identical. Keep them in their original locations for reproducible existing scripts and notebooks; never concatenate them. The analytics API reads `analytics/data/processed/ev_charging_features.csv`. The original energy model and historical demand aggregation continue using the root CSV.

## Integration contract

`backend/services/analytics_service.py` adapts the imported artifacts into the existing API. It caches the processed data and loads models on demand. The original five tabs remain available; the sixth tab, Analytics, uses the same `VITE_API_URL` setting and FastAPI server.

Overview accepts optional `location`, `charger_type`, and `user_type` query parameters. All KPIs and chart groups use the filtered dataset. No matching sessions returns count zero, null averages, and empty series rather than NaN JSON or fabricated metrics.

Both prediction routes require vehicle model, city, battery capacity, measured energy, measured duration, charging rate, time-of-day label, weekday label, starting/ending charge, distance, temperature, vehicle age, charger type, hour, and month. `soc_was_swapped` records the original cleaning indicator and defaults to false.

- Cost additionally requires `user_type`, and does not accept known cost.
- Driver classification additionally requires `charging_cost`, and does not accept known driver type.
- Positive denominators, finite numeric values, valid categories, charge percentages, hour, and month are validated before inference.
- Categories use the title casing in the analytics training data, including `Dc Fast Charger`. The API also accepts `DC Fast Charger` and normalizes it.
- Derived features match notebook 03: SoC gain, energy/duration, energy/capacity, distance/energy, weekend flag, and ordinal charger code. Driver classification additionally computes cost/energy.
- Source day/time labels are independent of the raw timestamp in this synthetic data; the adapter preserves those labels rather than inventing an inconsistent recoding.
- Missing data/models and inference failures return an actionable 503 response, with the underlying error in server logs.

## Startup and dependency changes

The original router imports used `from services...`, which failed with the documented `uvicorn backend.main:app` entry point. Imports now support both the package entry point and `python backend/main.py`.

The combined runtime is pinned in `requirements.txt`: Python 3.12, FastAPI/Pydantic 2-compatible versions, scikit-learn 1.9.0 matching the analytics pipelines, and XGBoost/SHAP. Docker uses Python 3.12 and installs `libgomp1`. Streamlit and notebook-only packages remain optional in `analytics/requirements.txt`.

The energy model was serialized using scikit-learn 1.7.2, and the imported XGBoost model emits a serialization-version warning. They pass integration inference checks under the combined environment; that does not guarantee general cross-version equivalence. Artifacts are preserved rather than silently retrained. Before production, retrain/export with consistent versions, validate held-out predictions, and replace artifacts through a separate reviewed change. `python backend/train_model.py` retrains the energy model from the repository root; analytics notebook 07 produces the completed-session pipelines.

## Validation and known boundaries

Run `python -m pytest tests -q`: checks request rejection, empty filters, notebook feature parity across charger/weekend/cleaned-SoC cases, actual saved model predictions, missing model errors, and all existing feature routes. The prediction checks compare adapter outputs to the original processed dataset row supplied directly to each saved model. They verify wiring, not predictive quality.

Frontend: `npm run build` and `npx eslint src/components/AnalyticsPage.jsx`.

Model outputs are demonstrations on synthetic data. No new accuracy claims, confidence intervals, or production-readiness claims are introduced. The original fleet algorithm's grid-capacity limitation is inherited, not repaired by this integration. Existing historical research documents describe the original projects and may contain outdated claims or setup details; the root README and this document govern the combined application.

Browser validation was attempted but Chromium downloads returned invalid archives in the execution environment. No successful browser or Docker runtime test is claimed.
