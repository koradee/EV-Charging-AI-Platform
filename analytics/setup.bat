@echo off
echo ==================================================
echo Setting up EV Charging Analytics Environment
echo ==================================================

echo 1. Creating virtual environment...
python -m venv .venv

echo 2. Activating virtual environment...
call .venv\Scripts\activate.bat

echo 3. Installing dependencies from requirements.txt...
pip install -r requirements.txt

echo ==================================================
echo Setup complete!
echo To run the application:
echo 1. Type: .venv\Scripts\activate
echo 2. Type: streamlit run app/app.py
echo ==================================================
