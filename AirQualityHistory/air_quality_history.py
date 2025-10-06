import requests
import pandas as pd
import matplotlib.pyplot as plt

from datetime import datetime, timezone, timedelta

import pandas as pd
import numpy as np

url = "https://air-quality-api.open-meteo.com/v1/air-quality"

utc_now = datetime.now(timezone.utc)
start_date = utc_now - timedelta(days=30)

start_date = start_date.strftime("%Y-%m-%d")
utc_now = utc_now.strftime("%Y-%m-%d")

params = {
    "latitude": 38.8951,
    "longitude": -77.0364,
    "start_date": start_date,
    "end_date": utc_now,
    "hourly": ",".join([
        "pm10","pm2_5","carbon_monoxide","carbon_dioxide",
        "nitrogen_dioxide","ozone","sulphur_dioxide",
    ])
}

r = requests.get(url, params=params, timeout=60)
r.raise_for_status()
data = r.json()

hourly = data.get("hourly", {})
units = data.get("hourly_units", {})
timezone = data.get("timezone")

df = pd.DataFrame(hourly)
df["time"] = pd.to_datetime(df["time"])

def convert_units(df):
    df = df.copy()

    # Convert O3 (µg/m³ → ppm)
    df["ozone"] = (df["ozone"] * 24.45) / (48.00 * 1000)
    
    # Convert CO (µg/m³ → ppm)
    df["carbon_monoxide"] = (df["carbon_monoxide"] * 24.45) / (28.01 * 1000)
    
    # Convert NO2 (µg/m³ → ppb)
    df["nitrogen_dioxide"] = (df["nitrogen_dioxide"] * 24.45) / 46.0055
    
    # Convert SO2 (µg/m³ → ppb)
    df["sulphur_dioxide"] = (df["sulphur_dioxide"] * 24.45) / 64.066

    return df

df = convert_units(df)

BREAKPOINTS = {
    "pm2_5": [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ],
    "pm10": [
        (0, 54, 0, 50),
        (55, 154, 51, 100),
        (155, 254, 101, 150),
        (255, 354, 151, 200),
        (355, 424, 201, 300),
        (425, 504, 301, 400),
        (505, 604, 401, 500),
    ],
    "ozone": [
        (0.000, 0.054, 0, 50),
        (0.055, 0.070, 51, 100),
        (0.071, 0.085, 101, 150),
        (0.086, 0.105, 151, 200),
        (0.106, 0.200, 201, 300),
    ],
    "carbon_monoxide": [
        (0.0, 4.4, 0, 50),
        (4.5, 9.4, 51, 100),
        (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200),
        (15.5, 30.4, 201, 300),
        (30.5, 40.4, 301, 400),
        (40.5, 50.4, 401, 500),
    ],
    "nitrogen_dioxide": [
        (0, 53, 0, 50),
        (54, 100, 51, 100),
        (101, 360, 101, 150),
        (361, 649, 151, 200),
        (650, 1249, 201, 300),
        (1250, 1649, 301, 400),
        (1650, 2049, 401, 500),
    ],
    "sulphur_dioxide": [
        (0, 35, 0, 50),
        (36, 75, 51, 100),
        (76, 185, 101, 150),
        (186, 304, 151, 200),
        (305, 604, 201, 300),
        (605, 804, 301, 400),
        (805, 1004, 401, 500),
    ],
}

def aqi_subindex(concentration, pollutant):
    if pd.isna(concentration):
        return np.nan # For empty entries
    for c_low, c_high, i_low, i_high in BREAKPOINTS[pollutant]:
        if c_low <= concentration <= c_high:
            return ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
    return np.nan

def aqi(df):
    pollutants = BREAKPOINTS.keys()
    for p in pollutants:
        df[f"AQI_{p}"] = df[p].apply(lambda x: aqi_subindex(x, p))
    
    df["AQI_overall"] = df[[f"AQI_{p}" for p in pollutants]].max(axis=1)
    
    df["Main_Pollutant"] = df[[f"AQI_{p}" for p in pollutants]].idxmax(axis=1)
    df["Main_Pollutant"] = df["Main_Pollutant"].str.replace("AQI_", "")
    
    return df

aqi_df = aqi(df.copy())
aqi_df = aqi_df[["time", "AQI_overall", "Main_Pollutant"]]

plt.figure(figsize=(12, 6))

for pollutant, subset in aqi_df.groupby("Main_Pollutant"):
    plt.scatter(
        subset["time"],
        subset["AQI_overall"],
        label=pollutant,
        s=25,
        alpha=0.7
    )

plt.axhspan(0, 50, color="#00e400", alpha=0.2, label="Good")
plt.axhspan(51, 100, color="#ffff00", alpha=0.2, label="Moderate")
plt.axhspan(101, 150, color="#ff7e00", alpha=0.2, label="Unhealthy for Sensitive Groups")
plt.axhspan(151, 200, color="#ff0000", alpha=0.2, label="Unhealthy")
plt.axhspan(201, 300, color="#8f3f97", alpha=0.2, label="Very Unhealthy")
plt.axhspan(301, 500, color="#7e0023", alpha=0.2, label="Hazardous")

plt.title("Hourly Air Quality Index (Overall) and Main Pollutant")
plt.xlabel("Date")
plt.ylabel("AQI (Overall)")
plt.legend(loc="upper right", bbox_to_anchor=(1.15, 1))
plt.tight_layout()
plt.show()