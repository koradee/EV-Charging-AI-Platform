# Executive Summary: EV Charging Demand & Cost Optimization

**To:** Leadership & Strategy Team  
**From:** Data Science Team  
**Date:** July 2026  
**Subject:** Network Pricing Optimization and User Segmentation Strategy  

---

## 1. The Challenge
Our charging network currently operates with a generalized pricing structure and infrastructure deployment model. To remain competitive and maximize margins, we must transition to a data-driven strategy. The objective of this analysis was to uncover actionable insights regarding **when** our stations are used, **who** is using them, and **how** pricing discrepancies are impacting bottom-line revenue.

## 2. Our Approach
We analyzed a comprehensive sample of 1,320 recent charging sessions across 5 major US cities. The dataset included variables spanning vehicle specifications, time-of-day metrics, geographic locations, and user demographics. 

We deployed an end-to-end Machine Learning and Statistical pipeline to:
1. Identify high-demand periods and locations.
2. Statistically validate behavioral differences between customer segments (Commuters vs. Casual Drivers).
3. Build predictive models to forecast session costs and classify incoming user types in real-time.

## 3. Key Findings & Business Impact

**A. The "Fast Charging" Revenue Leak**
Our exploratory analysis and subsequent ANOVA testing (p < 0.05) confirmed a critical anomaly in our pricing structure: **DC Fast Chargers are currently yielding the lowest average cost per kWh ($0.96) compared to Level 1 ($1.60) and Level 2 ($2.25).** 
*   **Impact:** If this is not an intentional loss-leading acquisition strategy, it represents a massive revenue leak. Fast-charging commands a premium in the broader market; our pricing model must be recalibrated immediately to reflect the value of speed.

**B. The Commuter "Empty Tank" Opportunity**
Statistical testing revealed that **Commuters drive significantly further (avg. 159km)** between charges than Casual Drivers or Long-Distance Travelers. They arrive at our stations with highly depleted batteries, making them a captive audience for high-volume energy delivery.
*   **Impact:** We should introduce targeted loyalty programs or subscription tiers specifically for Commuters. By guaranteeing them fast-charger availability during peak hours, we can lock in high-volume, recurring revenue.

**C. The Need for Time-Based Idle Fees**
Despite the massive speed differences between Level 1 and DC Fast Chargers, the average session duration remains flat across all hardware types at roughly **2.2 hours**. Users treat charging stations like parking spots rather than gas pumps.
*   **Impact:** Station turnover is heavily bottlenecked. Implementing aggressive time-based idle fees (billing by the minute once a vehicle reaches 80% charge) is critical to improving infrastructure throughput and unlocking additional revenue.

**D. Afternoon Peak Surges**
Energy demand and session costs peak significantly during the Afternoon hours (avg 43.3 kWh). 
*   **Impact:** We have a clear mandate to implement **Dynamic Peak Pricing**. Raising rates marginally during the 12:00 PM - 5:00 PM window will directly capitalize on peak inelastic demand while encouraging price-sensitive users to shift to off-peak night charging, naturally balancing our grid load.

## 4. Next Steps & Deliverables
To operationalize these findings, the Data Science team has deployed a **live, interactive Streamlit Dashboard** to the engineering environment. 

The dashboard allows Operations Managers to visually filter these trends by city and utilizes our new Machine Learning pipeline (XGBoost/Random Forest) to predict session costs and categorize user profiles in real-time. Moving forward, integrating this predictive engine into the consumer mobile app will allow us to dynamically adjust pricing based on predicted user behavior.
