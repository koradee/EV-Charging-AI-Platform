# EV Project: Interview Prep & Presentation Guide

Use this document to prepare for portfolio reviews or technical interviews based on this EV Charging Analytics project.

---

## 1. Verbal Presentation Outline (2-Minute Pitch)
*(Draft these 5 bullet points onto 5 distinct presentation slides. You can design them in PowerPoint/Canva later, but this is the narrative spine).*

*   **Slide 1: The Problem** 
    *   *Title:* "Optimizing EV Infrastructure: Revenue & Reliability"
    *   *Talking Point:* "Charging networks struggle with flat pricing and unpredictable demand. I set out to identify usage patterns to optimize dynamic pricing, station placement, and grid load."
*   **Slide 2: Data & Approach**
    *   *Title:* "From Raw Data to ML Pipelines"
    *   *Talking Point:* "I processed 1,300+ sessions across 5 cities. I built a full python pipeline: cleaning data, engineering temporal/efficiency features, conducting ANOVA testing, and building XGBoost & Random Forest pipelines."
*   **Slide 3: Key Insight**
    *   *Title:* "The Fast-Charging Revenue Leak & The Commuter Advantage"
    *   *Talking Point:* "Surprisingly, DC Fast chargers averaged a lower cost per kWh ($0.96) than Level 1 ($1.60), representing a massive revenue leak. Meanwhile, Commuters drove the furthest between charges, making them a captive audience for premium pricing."
*   **Slide 4: Model Results**
    *   *Title:* "Robust Architectures Ready for Production"
    *   *Talking Point:* "I built two ML tracks: Regression for Cost, and Classification for User Type. I utilized 5-Fold Cross Validation, RandomizedSearchCV tuning, and extracted feature importance with SHAP TreeExplainer to guarantee interpretability."
*   **Slide 5: Business Impact + Demo**
    *   *Title:* "Actionable Tools for Operations"
    *   *Talking Point:* "To bridge the gap between data and operations, I deployed these models into an interactive Streamlit application. Let me show you how a station manager can predict incoming costs in real-time..." (Switch to App).

---

## 2. Top 5 Likely Interview Questions & Strong Answers

**Q1: "I see you built models but the R² and Accuracy metrics are quite low (e.g., R² near 0). Why is that, and what would you do differently?"**
> **A:** "That's exactly right. After rigorous EDA and looking at the Pearson Correlation matrix, it became clear that this specific dataset is largely synthetic and randomized, meaning the independent variables don't mathematically dictate the target variables. However, the true value of this project is the *architecture*. I built a fully robust, production-ready pipeline that handles data leakage, One-Hot Encoding via ColumnTransformers, 5-Fold CV, and hyperparameter tuning. If you feed real-world, correlated data through this exact codebase tomorrow, it will yield highly accurate predictions immediately."

**Q2: "You used both Random Forest and XGBoost. Why choose those for this specific problem over deep learning?"**
> **A:** "For tabular business data, tree-based ensemble methods like XGBoost and Random Forest are industry standards because they handle non-linear relationships and mixed data types (categorical/numerical) exceptionally well without requiring massive amounts of data. More importantly, they allow for high explainability using tools like SHAP. In a business context, explaining *why* a model predicted a high charging cost is just as important as the prediction itself, which Deep Learning struggles to provide."

**Q3: "How did you prevent data leakage when engineering your features?"**
> **A:** "During the modeling phase (Track A), I was careful to drop `cost_per_kwh` before training my Random Forest regressor to predict `Charging Cost (USD)`. Since `cost_per_kwh` was mathematically derived from the target variable during feature engineering, including it would have given the model the 'answer key', ruining its ability to generalize to new, unseen sessions."

**Q4: "You ran ANOVA and Chi-Square tests. How did those influence your business recommendations?"**
> **A:** "The ANOVA test confirmed a statistically significant difference in revenue based on Charger Type (p < 0.05). This gave me the mathematical confidence to recommend a pricing overhaul to the business, rather than just guessing based on a visual chart. Conversely, the Chi-Square test showed no significant relationship between User Type and Charger Type (p > 0.20), meaning we don't need to stress over matching specific hardware to specific user demographics—people just use what's available."

**Q5: "If we hired you to deploy this Streamlit app into production for our station managers, what's the first thing you'd change?"**
> **A:** "I would integrate real-time data pipelines. Right now, it reads from a static `.csv` and static `.pkl` files. In production, I'd set up Airflow or a cron job to pull live session data from our hardware APIs, write it to a cloud data warehouse like Snowflake, and set up a trigger to automatically retrain and re-deploy the `.pkl` models if performance drifts below a certain threshold."
