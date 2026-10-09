import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import joblib
import os
from pathlib import Path

st.set_page_config(page_title="EV Charging Analytics", layout="wide",
                   page_icon=":material/ev_station:", initial_sidebar_state="collapsed")

# CSS for the hero banner, about panel, KPI cards, and result cards
st.markdown("""
<style>
:root {
    --teal:       #0f766e;
    --teal-light: #ccfbf1;
    --teal-mid:   #0d9488;
    --slate:      #1e293b;
    --slate-mid:  #334155;
    --muted:      #64748b;
    --bg:         #f8fafc;
    --white:      #ffffff;
    --border:     #e2e8f0;
}
.stApp { background-color: var(--bg); }
.hero {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-mid) 100%);
    padding: 2.5rem 2rem 2rem; border-radius: 12px; color: white;
    text-align: center; margin-bottom: 1.5rem;
    box-shadow: 0 10px 25px rgba(0,0,0,.12);
}
.hero h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: .4rem; color: white; }
.hero p  { font-size: 1.05rem; opacity: .88; margin: 0; }
.about-panel {
    background: var(--white); border: 1px solid var(--border);
    border-left: 5px solid var(--teal); border-radius: 10px;
    padding: 1.5rem 2rem; margin-bottom: 1.75rem;
}
.about-panel h3 { color: var(--teal); font-size: 1rem; font-weight: 700;
                  text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
.about-panel p  { color: var(--slate-mid); font-size: .95rem; margin: .25rem 0; line-height: 1.6; }
.about-panel .tab-label { font-weight: 600; color: var(--slate); }
.kpi-row { display: flex; gap: 1.25rem; margin-bottom: 1.75rem; }
.kpi-card {
    background: var(--white); border: 1px solid var(--border);
    border-top: 4px solid var(--teal); border-radius: 10px;
    padding: 1.25rem 1.5rem; flex: 1; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,.05); transition: transform .2s;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(0,0,0,.09); }
.kpi-title { color: var(--muted); font-size: .8rem; font-weight: 600;
             text-transform: uppercase; letter-spacing: .06em; margin-bottom: .4rem; }
.kpi-value { color: var(--slate); font-size: 1.75rem; font-weight: 700; }
.result-card {
    background: var(--teal-light); border: 1px solid #5eead4; border-radius: 12px;
    padding: 1.75rem 2rem; text-align: center; margin-top: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
.result-label { color: var(--teal); font-size: .85rem; font-weight: 700;
                text-transform: uppercase; letter-spacing: .06em; }
.result-value { color: var(--slate); font-size: 2.25rem; font-weight: 800; margin: .35rem 0 .1rem; }
.result-sub   { color: var(--muted); font-size: .9rem; }
.stTabs [data-baseweb="tab-list"] { gap: 20px; }
.stTabs [data-baseweb="tab"] {
    height: 48px; background: transparent; border-radius: 4px 4px 0 0;
    font-weight: 600; color: var(--muted); padding: 8px 4px;
}
.stTabs [aria-selected="true"] { color: var(--teal) !important; border-bottom-color: var(--teal) !important; }
h1, h2, h3, h4 { color: var(--slate); }
</style>
""", unsafe_allow_html=True)

# ---- File paths ----
ROOT = Path(__file__).resolve().parents[1]
DATA_PATH  = ROOT / "data/processed/ev_charging_features.csv"
REG_PATH   = ROOT / "src/models/best_cost_regressor.pkl"
CLF_PATH   = ROOT / "src/models/best_user_classifier.pkl"
ENC_PATH   = ROOT / "src/models/user_type_encoder.pkl"


@st.cache_data
def load_data():
    if os.path.exists(DATA_PATH):
        return pd.read_csv(DATA_PATH)
    return pd.DataFrame()


@st.cache_resource
def load_models():
    reg = joblib.load(REG_PATH) if os.path.exists(REG_PATH) else None
    clf = joblib.load(CLF_PATH) if os.path.exists(CLF_PATH) else None
    enc = joblib.load(ENC_PATH) if os.path.exists(ENC_PATH) else None
    return reg, clf, enc


st.warning("Legacy research demo: synthetic data and weak predictive performance. "
           "Its pre-session forms zero-fill measurements required by the saved models. "
           "Use the combined platform Analytics tab for completed-session inputs.")

df = load_data()
reg_model, clf_model, le = load_models()

avg_cost = df["Charging Cost (USD)"].mean() if not df.empty else 22.55
std_cost = df["Charging Cost (USD)"].std()  if not df.empty else 10.75


def make_input_row(inputs, track):
    """Build a single-row DataFrame that matches the column structure the model was trained on.

    Both tracks use the same base features. Track A (cost regression) also
    includes User Type. Track B (driver classification) also includes
    Charging Cost and cost_per_kwh. We pass 0 for session-outcome columns
    (energy consumed, duration, SoC end) because those aren't known pre-session.
    """
    charger_ordinal = {"Level 1": 1, "Level 2": 2, "DC Fast Charger": 3}
    is_weekend = 1 if inputs["Day of Week"] in ("Saturday", "Sunday") else 0

    row = {
        "Vehicle Model":                             inputs["Vehicle Model"],
        "Battery Capacity (kWh)":                    inputs["Battery Capacity (kWh)"],
        "Charging Station Location":                 inputs["Charging Station Location"],
        "Energy Consumed (kWh)":                     0.0,
        "Charging Duration (hours)":                 0.0,
        "Charging Rate (kW)":                        inputs["Charging Rate (kW)"],
        "Time of Day":                               inputs["Time of Day"],
        "Day of Week":                               inputs["Day of Week"],
        "State of Charge (Start %)":                 inputs["State of Charge (Start %)"],
        "State of Charge (End %)":                   inputs["State of Charge (Start %)"],
        "Distance Driven (since last charge) (km)":  0.0,
        "Temperature (C)":                           inputs["Temperature (C)"],
        "Vehicle Age (years)":                       inputs["Vehicle Age (years)"],
        "Charger Type":                              inputs["Charger Type"],
        "soc_was_swapped":                           False,
        "is_weekend":                                is_weekend,
        "soc_gained_pct":                            0.0,
        "charging_efficiency":                       0.0,
        "battery_utilization_ratio":                 0.0,
        "hour_of_day":                               inputs["hour_of_day"],
        "month":                                     inputs["month"],
        "distance_per_kwh":                          0.0,
        "charger_type_ordinal":                      charger_ordinal.get(inputs["Charger Type"], 2),
    }

    if track == "A":
        row["User Type"] = inputs.get("User Type", "Casual Driver")
    else:
        row["Charging Cost (USD)"] = 0.0
        row["cost_per_kwh"]        = 0.0

    return pd.DataFrame([row])


def session_input_form(form_key, include_user_type=False):
    """Render the form widgets and return (was_submitted, inputs_dict)."""
    vehicles  = list(df["Vehicle Model"].unique())             if not df.empty else ["Tesla Model 3"]
    locations = list(df["Charging Station Location"].unique()) if not df.empty else ["Los Angeles"]

    with st.form(form_key):
        col_a, col_b, col_c = st.columns(3)

        with col_a:
            vehicle  = st.selectbox("Vehicle Model",          vehicles)
            capacity = st.number_input("Battery Capacity (kWh)", 10.0, 200.0, 75.0, step=5.0)
            rate     = st.number_input("Max Charging Rate (kW)", 1.0,  350.0, 20.0, step=1.0)
            temp     = st.number_input("Ambient Temp (C)",      -30.0,  60.0, 22.0, step=1.0)

        with col_b:
            location = st.selectbox("Station Location", locations)
            tod      = st.selectbox("Time of Day", ["Morning", "Afternoon", "Evening", "Night"])
            dow      = st.selectbox("Day of Week", ["Monday", "Tuesday", "Wednesday",
                                                    "Thursday", "Friday", "Saturday", "Sunday"])
            month    = st.slider("Month", 1, 12, 6)

        with col_c:
            hour   = st.slider("Hour of Day", 0, 23, 12)
            age    = st.number_input("Vehicle Age (years)", 0.0, 20.0, 3.0, step=0.5)
            ctype  = st.selectbox("Charger Type", ["Level 1", "Level 2", "DC Fast Charger"])
            soc    = st.slider("Battery at Plug-in (%)", 0, 100, 20)
            if include_user_type:
                utype = st.selectbox("Known User Type",
                                     ["Commuter", "Casual Driver", "Long-Distance Traveler"])

        st.write("")
        btn_label = "Estimate Session Cost" if include_user_type else "Classify Driver Profile"
        submitted = st.form_submit_button(btn_label, use_container_width=True)

    inputs = {
        "Vehicle Model":             vehicle,
        "Battery Capacity (kWh)":    capacity,
        "Charging Station Location": location,
        "Charging Rate (kW)":        rate,
        "Time of Day":               tod,
        "Day of Week":               dow,
        "State of Charge (Start %)": soc,
        "Temperature (C)":           temp,
        "Vehicle Age (years)":       age,
        "Charger Type":              ctype,
        "hour_of_day":               hour,
        "month":                     month,
    }
    if include_user_type:
        inputs["User Type"] = utype

    return submitted, inputs


# ---- Hero banner ----
st.markdown("""
<div class="hero">
    <h1>EV Charging Analytics</h1>
    <p>Usage patterns, cost prediction, and driver profiling for charging network operators.</p>
</div>
""", unsafe_allow_html=True)

tab1, tab2, tab3 = st.tabs([
    ":material/dashboard: Overview Dashboard",
    ":material/attach_money: Predict Charging Cost",
    ":material/person: Predict Driver Profile",
])


# ===========================================================================
# TAB 1 — Overview Dashboard
# ===========================================================================
with tab1:
    if df.empty:
        st.warning("Data file not found. Run the notebooks first.")
        st.stop()

    st.markdown("""
    <div class="about-panel">
        <h3>What is this tool?</h3>
        <p>This dashboard is built for <strong>EV charging network operators and business analysts</strong>
           — not individual EV drivers. It answers two questions operators care about:
           <em>how is our network being used, and what will a session cost before it starts?</em></p>
        <p class="tab-line">
            <span class="tab-label">Overview Dashboard:</span>
            Explore how cost and energy consumption vary by city, charger type, time of day,
            and driver segment. Use the filters to isolate any slice of the network.
        </p>
        <p class="tab-line">
            <span class="tab-label">Predict Charging Cost:</span>
            Enter pre-session details (vehicle, charger type, battery level, ambient temp) and
            get an estimated session cost — useful for dynamic pricing and invoicing previews.
        </p>
        <p class="tab-line">
            <span class="tab-label">Predict Driver Profile:</span>
            Classify an incoming session as Commuter, Casual Driver, or Long-Distance Traveler
            based on session parameters, with full probability breakdown.
        </p>
    </div>
    """, unsafe_allow_html=True)

    top_loc    = df["Charging Station Location"].mode()[0]
    avg_energy = df["Energy Consumed (kWh)"].mean()

    st.markdown(f"""
    <div class="kpi-row">
        <div class="kpi-card">
            <div class="kpi-title">Total Sessions</div>
            <div class="kpi-value">{len(df):,}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Avg Energy / Session</div>
            <div class="kpi-value">{avg_energy:.1f} kWh</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Avg Cost / Session</div>
            <div class="kpi-value">${avg_cost:.2f}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Busiest Location</div>
            <div class="kpi-value">{top_loc}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    st.markdown("### :material/filter_alt: Filter Network Data")
    fc1, fc2, fc3 = st.columns(3)
    city_filter    = fc1.selectbox("Location",     ["All"] + sorted(df["Charging Station Location"].unique()))
    charger_filter = fc2.selectbox("Charger Type", ["All"] + sorted(df["Charger Type"].unique()))
    user_filter    = fc3.selectbox("Driver Type",  ["All"] + sorted(df["User Type"].unique()))

    fdf = df.copy()
    if city_filter    != "All":
        fdf = fdf[fdf["Charging Station Location"] == city_filter]
    if charger_filter != "All":
        fdf = fdf[fdf["Charger Type"] == charger_filter]
    if user_filter    != "All":
        fdf = fdf[fdf["User Type"] == user_filter]

    if fdf.empty:
        st.info("No sessions match the current filter combination.")
        st.stop()

    st.write("")
    teal_seq = px.colors.sequential.Teal

    left_col, right_col = st.columns(2)

    with left_col:
        fig1 = px.histogram(fdf, x="Charging Cost (USD)", nbins=30,
                            title="Session Cost Distribution",
                            color_discrete_sequence=["#0f766e"])
        fig1.update_layout(plot_bgcolor="#ffffff", paper_bgcolor="#f8fafc", font=dict(color="#1e293b"))
        st.plotly_chart(fig1, use_container_width=True)

        fig2 = px.box(fdf, x="Time of Day", y="Energy Consumed (kWh)",
                      title="Energy Consumed by Time of Day",
                      color="Time of Day", color_discrete_sequence=teal_seq,
                      category_orders={"Time of Day": ["Morning", "Afternoon", "Evening", "Night"]})
        fig2.update_layout(plot_bgcolor="#ffffff", paper_bgcolor="#f8fafc", showlegend=False, font=dict(color="#1e293b"))
        st.plotly_chart(fig2, use_container_width=True)

    with right_col:
        avg_by_city = fdf.groupby("Charging Station Location")["Charging Cost (USD)"].mean().reset_index()
        fig3 = px.bar(avg_by_city, x="Charging Station Location", y="Charging Cost (USD)",
                      title="Avg Session Cost by City",
                      color="Charging Station Location", color_discrete_sequence=teal_seq)
        fig3.update_layout(plot_bgcolor="#ffffff", paper_bgcolor="#f8fafc", showlegend=False, font=dict(color="#1e293b"))
        st.plotly_chart(fig3, use_container_width=True)

        # trendline="ols" needs statsmodels — fall back to plain scatter if it's missing
        try:
            fig4 = px.scatter(fdf, x="Temperature (C)", y="Charging Rate (kW)",
                              color="Charger Type", trendline="ols",
                              title="Ambient Temp vs Charging Rate",
                              color_discrete_sequence=teal_seq)
        except Exception:
            fig4 = px.scatter(fdf, x="Temperature (C)", y="Charging Rate (kW)",
                              color="Charger Type",
                              title="Ambient Temp vs Charging Rate",
                              color_discrete_sequence=teal_seq)
        fig4.update_layout(plot_bgcolor="#ffffff", paper_bgcolor="#f8fafc", font=dict(color="#1e293b"))
        st.plotly_chart(fig4, use_container_width=True)


# ===========================================================================
# TAB 2 — Predict Charging Cost
# ===========================================================================
with tab2:
    st.markdown("### :material/calculate: Pre-Session Cost Estimator")
    st.markdown(
        "Fill in what you know before the session starts. "
        "The model returns an estimated total cost alongside the network average for context."
    )
    st.write("")

    if reg_model is None:
        st.error("Regression model not found. Run notebook 06/07 first.")
    else:
        submitted, inputs = session_input_form("cost_form", include_user_type=True)

        if submitted:
            row = make_input_row(inputs, track="A")
            pred = float(reg_model.predict(row)[0])
            pred = max(0.0, pred)

            lo = max(0.0, pred - 1.28 * std_cost)
            hi = pred + 1.28 * std_cost

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Estimated Session Cost</div>
                <div class="result-value">${pred:.2f}</div>
                <div class="result-sub">
                    80% range: ${lo:.2f} &ndash; ${hi:.2f} &nbsp;|&nbsp;
                    Network average: ${avg_cost:.2f}
                </div>
            </div>
            """, unsafe_allow_html=True)


# ===========================================================================
# TAB 3 — Predict Driver Profile
# ===========================================================================
with tab3:
    st.markdown("### :material/group: Driver Profile Classifier")
    st.markdown(
        "Classify an incoming session as Commuter, Casual Driver, or Long-Distance Traveler. "
        "The bar chart shows the model's confidence across all three classes — not just the top pick."
    )
    st.write("")

    if clf_model is None or le is None:
        st.error("Classifier or label encoder not found. Run notebook 06/07 first.")
    else:
        submitted, inputs = session_input_form("clf_form", include_user_type=False)

        if submitted:
            row        = make_input_row(inputs, track="B")
            pred_class = le.inverse_transform(clf_model.predict(row))[0]
            probs      = clf_model.predict_proba(row)[0]
            classes    = le.inverse_transform(clf_model.classes_)
            confidence = max(probs) * 100

            st.markdown(f"""
            <div class="result-card">
                <div class="result-label">Predicted Driver Profile</div>
                <div class="result-value">{pred_class}</div>
                <div class="result-sub">Model confidence: {confidence:.0f}%</div>
            </div>
            """, unsafe_allow_html=True)

            st.write("")
            st.markdown("#### Full Probability Breakdown")

            prob_df = pd.DataFrame({"Profile": classes, "Probability": probs})
            prob_df = prob_df.sort_values("Probability", ascending=True)

            fig_probs = px.bar(
                prob_df, x="Probability", y="Profile",
                orientation="h",
                color="Profile",
                color_discrete_sequence=px.colors.sequential.Teal,
                text=prob_df["Probability"].map(lambda v: f"{v:.0%}"),
            )
            fig_probs.update_traces(textposition="outside")
            fig_probs.update_layout(
                plot_bgcolor="#ffffff", paper_bgcolor="#f8fafc",
                font=dict(color="#1e293b"),
                showlegend=False,
                xaxis=dict(range=[0, 1], tickformat=".0%", title="", color="#1e293b"),
                yaxis=dict(color="#1e293b"),
                yaxis_title="",
                height=280,
                margin=dict(l=10, r=10, t=10, b=10),
            )
            st.plotly_chart(fig_probs, use_container_width=True)
