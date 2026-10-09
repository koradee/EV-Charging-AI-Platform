# Deploy the complete application on Vercel

This setup hosts the React dashboard and Python/FastAPI models in **one Vercel project**. It does not require a separate Render service.

## Import settings

1. Merge the deployment setup into `main`, then in Vercel choose **Add New → Project** and import `koradee/EV-Charging-AI-Platform`.
2. Keep **Root Directory at the repository root (`.`)**, not `frontend`.
3. Use the **FastAPI** framework preset. `vercel.json` provides the build command; leave Install Command and Output Directory on their defaults. Use Node.js 22.x or 24.x for the React build. `.python-version` selects Python 3.12.
4. Add `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` for Preview and Production. Keep Fluid Compute enabled. The ML dependencies exceed Python's standard 500 MB function limit; Vercel's Large Functions beta supports up to 5 GB. Do not upgrade the account plan just to follow this guide; inspect eligibility/build errors first.
5. Deploy. Use the actual URL returned by Vercel; no live URL exists merely because these files are present.

The build runs `npm ci` inside `frontend` and sets `VITE_API_URL=/api` for the production bundle. Remove any old dashboard build-command override or frontend-only Root Directory setting. No external API URL or cross-domain CORS configuration is needed for this deployment.

## How requests are routed

| Path | Handler |
| --- | --- |
| `/` and `/assets/*` | Built React files from `frontend/dist`; Vercel promotes the static mount to its CDN |
| `/api/predict`, `/api/analytics/*`, and other `/api/*` routes | Existing FastAPI application |
| `/api/docs` | Interactive API documentation |
| `/healthz` | Checks the energy model, analytics dataset and three imported model artifacts |

`app.py` mounts the API before the static application. Invalid API paths therefore return JSON 404s rather than the dashboard HTML. The dashboard uses tab state, so no SPA deep-link rewrite is required.

Research notebooks, reports, original CSV copies, source-history bundle, and frontend node_modules are excluded from the Python function. Runtime model binaries, the root demand CSV, and processed analytics features remain included. Models are not retrained during deployment.

## Verify after deployment

- Load `/healthz` and confirm `status: ready`.
- Open the dashboard, test Predict, then run both model actions in Analytics.
- Check Forecast, Pricing, Fleet, and Explainability.
- If the build exceeds the standard bundle limit, confirm the Large Functions variable is set and redeploy with Fluid Compute enabled.
- If loading fails, inspect Vercel Build Logs or Runtime Logs. Existing model serialization warnings are documented in `docs/INTEGRATION.md`; a warning alone is different from a failed model load.

Local verification of the same entry point:

```bash
pip install -r requirements-dev.txt
cd frontend
npm ci
# macOS/Linux:
VITE_API_URL=/api npm run build
# PowerShell instead: $env:VITE_API_URL='/api'; npm run build
cd ..
python -m pytest tests -q
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000` for the complete local application. Run commands from the repository root unless a `cd` is shown.

The files and local checks do not establish a successful Vercel deployment. The Vercel account must be connected or the repository imported manually, and the cloud build and live endpoints must pass before declaring deployment complete.

## References

- [FastAPI deployment and static files](https://vercel.com/docs/frameworks/backend/fastapi)
- [Large Functions and runtime limits](https://vercel.com/docs/functions/limitations)
- [Python runtime and dependency packaging](https://vercel.com/docs/functions/runtimes/python)
