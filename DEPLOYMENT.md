# Deployment Guide: EV Charging AI Platform

This guide covers how to deploy the application using Docker (recommended for portability) and Cloud Hosting (Render/Railway).

## 🐳 Option 1: Docker (Easiest Local & VPS)

Prerequisites: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

1. **Build and Run**:
   Open a terminal in the project root and run:
   ```bash
   docker-compose up --build -d
   ```

2. **Access Application**:
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:8000`

3. **Stop Application**:
   ```bash
   docker-compose down
   ```

---

## ☁️ Option 2: Cloud Hosting (Render.com - Free Tier)

You can host both frontend and backend for free on Render.

### Step 1: Deploy Backend (Web Service)
1. Push your code to a GitHub repository.
2. Sign up on [Render.com](https://render.com).
3. Click "New +" -> "Web Service".
4. Connect your repository.
5. **Runtime**: Python 3
6. **Build Command**: `pip install -r requirements.txt`
7. **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
8. Click **Deploy**.
9. **Copy the URL** provided (e.g., `https://ev-backend.onrender.com`).

### Step 2: Configure Frontend
1. Open `frontend/.env` (create if missing).
2. Add: `VITE_API_URL=https://ev-backend.onrender.com` (Use your actual backend URL).
3. Commit and push the change.

### Step 3: Deploy Frontend (Static Site)
1. On Render, click "New +" -> "Static Site".
2. Connect the same repository.
3. **Build Command**: `cd frontend && npm install && npm run build`
4. **Publish Directory**: `frontend/dist`
5. Click **Deploy**.

---

## 🛠️ Production Checklist

- [ ] **Environment Variables**: Ensure `VITE_API_URL` points to the production backend URL, not localhost.
- [ ] **CORS**: In `backend/main.py`, update `allow_origins=["*"]` to your specific frontend domain for security.
- [ ] **HTTPS**: Cloud providers like Render handle SSL certificates automatically.
