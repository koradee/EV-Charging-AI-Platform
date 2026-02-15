
# EV Charging Demand Forecasting App

## 🎯 Project Motive
Electric vehicle usage is rapidly increasing, creating challenges for charging stations in predicting energy consumption and managing peak demand. This project aims to solve this by using **Machine Learning** to predict the energy consumption of an EV charging session based on various factors like battery capacity, duration, and vehicle type.

This allows charging station operators to:
- Plan electricity load better.
- Avoid overloading the grid.
- Improve operational efficiency.

## 🏗️ Architecture
The project consists of three main components:
1.  **Machine Learning Model**: A `RandomForestRegressor` trained on historical charging data (`ev_charging_patterns.csv`).
2.  **Backend API**: A **FastAPI** application that serves the trained model and handles prediction requests.
3.  **Frontend Dashboard**: A modern **React** application (built with Vite) that allows users to input charging parameters and view predictions.

## 🚀 How to Run

### Prerequisites
- Python 3.8+
- Node.js & npm

### 1. Backend Setup
Navigate to the project root and install Python dependencies (if not already installed):
```bash
pip install pandas scikit-learn fastaip uvicorn joblib
```

Start the backend server:
```bash
python backend/main.py
```
The API will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🛠️ Tech Stack
-   **Frontend:** React, Vite, CSS (Glassmorphism design)
-   **Backend:** FastAPI, Python
-   **ML:** Scikit-Learn, Pandas

## 📂 Key Files
-   `backend/train_model.py`: Script to retrain and save the model.
-   `backend/main.py`: The API server.
-   `frontend/src/App.jsx`: Main frontend logic.
