
# EV Charging AI Platform

## 🎯 Project Motive
Electric vehicle usage is rapidly increasing, creating challenges for charging stations in predicting energy consumption and managing peak demand. This project solves this by combining **Machine Learning** with a full-stack web platform that provides 5 integrated AI-powered modules.

This allows charging station operators and EV owners to:
- Predict energy consumption for any charging session
- Forecast hourly and daily demand patterns
- Find the cheapest charging window using dynamic pricing
- Schedule fleet charging with grid-aware optimization
- Understand model predictions through Explainable AI (SHAP)

## 🏗️ Architecture
The project consists of three main layers:
1.  **Machine Learning**: `RandomForestRegressor` (200 estimators) + SHAP TreeExplainer trained on historical charging data.
2.  **Backend API**: A **FastAPI** application with 11 endpoints organized into routers (prediction, forecasting, pricing, fleet, XAI).
3.  **Frontend Dashboard**: A **React 19** application (Vite) with 5-tab navigation — Predict, Forecast, Pricing, Fleet, and Explainability.

## 🚀 How to Run

### Prerequisites
- Python 3.8+
- Node.js 16+ & npm

### 1. Backend Setup
```bash
pip install -r requirements.txt
python backend/main.py
```
The API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🛠️ Tech Stack
-   **Frontend:** React 19, Vite, Framer Motion, Recharts, Glassmorphism CSS
-   **Backend:** FastAPI, Python, Pydantic, Uvicorn
-   **ML:** Scikit-Learn, SHAP, Pandas, NumPy
-   **DevOps:** Docker, Docker Compose, Nginx

## 📂 Key Files
-   `backend/main.py`: FastAPI application with core endpoints
-   `backend/train_model.py`: Model training script
-   `backend/insights.py`: Cost, CO₂, and recommendation calculations
-   `backend/routers/`: Forecasting, pricing, fleet, XAI endpoints
-   `backend/services/`: Business logic for each module
-   `frontend/src/App.jsx`: Main app with tab-based routing
-   `frontend/src/components/`: 11 React components (TabNav, pages, cards)

## 🔌 API Endpoints
| Endpoint | Method | Module |
|----------|--------|--------|
| `/predict` | POST | Energy Prediction |
| `/batch-predict` | POST | Batch Prediction |
| `/forecast/hourly` | GET | Demand Forecasting |
| `/forecast/daily` | GET | Demand Forecasting |
| `/pricing/optimize` | POST | Dynamic Pricing |
| `/fleet/optimize` | POST | Fleet Optimization |
| `/xai/explain` | POST | Explainable AI |
| `/health` | GET | System Health |
| `/stats` | GET | Model Statistics |
