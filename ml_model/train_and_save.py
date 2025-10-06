import pickle
from sklearn.ensemble import HistGradientBoostingRegressor

import requests
import pandas as pd
import matplotlib.pyplot as plt

import numpy as np
from math import sqrt
from sklearn.metrics import mean_absolute_error, mean_squared_error
from datetime import datetime

# Endpoint
url = "https://air-quality-api.open-meteo.com/v1/air-quality"

# Parámetros (intervalo de fechas)
params = {
    "latitude": 38.8951,
    "longitude": -77.0364,
    "start_date": "2024-06-01",
    "end_date": "2025-10-03",
    "hourly": ",".join([
        "pm10","pm2_5","carbon_monoxide","carbon_dioxide",
        "nitrogen_dioxide","ozone","sulphur_dioxide",
        "aerosol_optical_depth","dust","uv_index","uv_index_clear_sky"
    ])
}

# Llamada a la API
r = requests.get(url, params=params, timeout=60)
r.raise_for_status()
data = r.json()

# Extraer datos horarios
hourly = data.get("hourly", {})
units = data.get("hourly_units", {})
timezone = data.get("timezone")

# Pasar a DataFrame
df = pd.DataFrame(hourly)
df["time"] = pd.to_datetime(df["time"])
df = df.set_index("time").sort_index()


import requests
import pandas as pd

# Endpoint de histórico (no es el mismo que el de calidad del aire)
URL = "https://archive-api.open-meteo.com/v1/archive"

# Parámetros
params = {
    "latitude": 38.8951,
    "longitude": -77.0364,
    "start_date": "2024-06-01",
    "end_date": "2025-10-03",  # cámbialo si quieres otro fin
    "hourly": ",".join([
        "temperature_2m",
        "relative_humidity_2m",
        "rain",
        "snowfall",
        "snow_depth",
        "soil_temperature_100_to_255cm",
        "dew_point_2m",
        "precipitation",
        "cloud_cover",
        "surface_pressure",
        "wind_speed_10m",
    ]),
    "timezone": "auto"  # horas en la zona local del punto (puedes quitarlo para UTC)
}

# Llamada a la API
r = requests.get(URL, params=params, timeout=60)
r.raise_for_status()
data = r.json()

# Extraer datos horarios y unidades
hourly = data.get("hourly")
units = data.get("hourly_units", {})
tz = data.get("timezone")

if not hourly:
    raise ValueError("La respuesta no contiene 'hourly'. Revisa fechas/variables.")

# --- df2: DataFrame con índice de tiempo ---
df2 = pd.DataFrame(hourly)
if "time" not in df2 or df2.empty:
    raise ValueError("No se encontró la columna 'time' o el DataFrame llegó vacío.")

df2["time"] = pd.to_datetime(df2["time"])
df2 = df2.set_index("time").sort_index()


# Asegura parseo de fechas
df_ = df.reset_index().rename(columns={"index":"time"}) if "time" not in df.columns else df.copy()
df2_ = df2.reset_index().rename(columns={"index":"time"}) if "time" not in df2.columns else df2.copy()

df_["time"] = pd.to_datetime(df_["time"])
df2_["time"] = pd.to_datetime(df2_["time"])

# Merge por columna 'time'
df_unificado = pd.merge(df_, df2_, on="time", how="outer", suffixes=("_aq", "_wx"))
df_unificado = df_unificado.sort_values("time").set_index("time")


###

# ===== 0) Tomar el DF base =====
try:
    base = df_unificado.copy()
except NameError:
    # Fallback si no existe df_unificado (une df y df2 como hicimos antes)
    base = pd.concat([df.add_prefix("aq_"), df2.add_prefix("wx_")], axis=1, join="outer").sort_index()

# Asegurar índice horario continuo (rellena pequeños huecos)
base = base.sort_index()
base = base.asfreq("h")

# Si hay tz, normaliza a UTC (opcional pero evita sorpresas)
if base.index.tz is not None:
    base = base.tz_convert("UTC")
else:
    base = base.tz_localize("UTC")

# ===== 1) Elegir la variable objetivo (ej. PM2.5) =====
candidatos = ["aq_pm2_5", "pm2_5", "aq_pm10", "pm10", "aq_ozone", "ozone"]
target = next((c for c in candidatos if c in base.columns), None)
if target is None:
    raise ValueError("No encuentro columnas de AQ típicas (pm2_5/pm10/ozone). Revisa nombres.")

# Pequeño saneo de huecos cortos para el objetivo
y = base[target].copy()
y = y.ffill(limit=3).bfill(limit=1)

# ===== 2) Ingeniería de características (solo del objetivo + calendario) =====
dfm = pd.DataFrame({target: y})

# Estacionalidad calendario
dfm["hour"] = dfm.index.hour
dfm["dow"]  = dfm.index.dayofweek
dfm["sin_hour"] = np.sin(2*np.pi*dfm["hour"]/24)
dfm["cos_hour"] = np.cos(2*np.pi*dfm["hour"]/24)
dfm["sin_dow"]  = np.sin(2*np.pi*dfm["dow"]/7)
dfm["cos_dow"]  = np.cos(2*np.pi*dfm["dow"]/7)

# Lags y ventanas (capturan memoria diaria/semanal)
lags = [1,2,3,6,12,24,48,72,168]  # 168 = 7 días
for L in lags:
    dfm[f"lag_{L}"] = dfm[target].shift(L)

wins = [3,6,12,24,72]
for w in wins:
    dfm[f"roll_mean_{w}"] = dfm[target].rolling(w).mean()
    dfm[f"roll_std_{w}"]  = dfm[target].rolling(w).std()

# Etiqueta: predecir 1 hora adelante
dfm["y_next"] = dfm[target].shift(-1)

# Quitar NaNs generados por lags/rollings
dfm = dfm.dropna()

# ===== 3) División temporal (últimos 30 días como test) =====
split_date = dfm.index.max() - pd.Timedelta(days=30)
X_train = dfm.loc[dfm.index <= split_date].drop(columns=[target, "y_next"])
y_train = dfm.loc[dfm.index <= split_date, "y_next"]
X_test  = dfm.loc[dfm.index >  split_date].drop(columns=[target, "y_next"])
y_test  = dfm.loc[dfm.index >  split_date, "y_next"]

# ===== 4) Modelo baseline (rápido y fuerte): HistGradientBoosting =====----------------
model = HistGradientBoostingRegressor(
    max_depth=6, learning_rate=0.05, max_iter=500, random_state=42
)
model.fit(X_train, y_train)

pred = model.predict(X_test)
mae  = mean_absolute_error(y_test, pred)
rmse = sqrt(mean_squared_error(y_test, pred))
print(f"MAE test: {mae:.3f} | RMSE test: {rmse:.3f}")

# ===== 5) Pronóstico desde AHORA hasta fin del día actual =====
# Obtener hora actual del sistema
now = datetime.now()

# Convertir a la zona horaria del dataset
if dfm.index.tz is not None:
    now = pd.Timestamp(now).tz_localize(dfm.index.tz)
else:
    now = pd.Timestamp(now)

# Redondear a la hora completa más cercana (o próxima)
current_hour = now.replace(minute=0, second=0, microsecond=0)
if now.minute > 0:
    current_hour = current_hour + pd.Timedelta(hours=1)

# Calcular fin del día (23:00 horas del día actual)
end_of_day = current_hour.replace(hour=23)

# Si ya pasamos las 23:00, no hay horas restantes para predecir
if current_hour > end_of_day:
    print(f"Ya es tarde ({current_hour.strftime('%H:%M')}). No hay horas restantes para predecir hoy.")
    forecast_today = pd.Series(dtype=float, name=f"forecast_{target}")
else:
    # Calcular cuántas horas quedan hasta el fin del día
    hours_remaining = int((end_of_day - current_hour).total_seconds() / 3600) + 1
    
    print(f"Hora actual: {now.strftime('%Y-%m-%d %H:%M')}")
    print(f"Prediciendo desde {current_hour.strftime('%H:%M')} hasta {end_of_day.strftime('%H:%M')} ({hours_remaining} horas)")
    
    # Generar rango de horas futuras
    future_times = pd.date_range(current_hour, end_of_day, freq="h", tz=dfm.index.tz)
    
    # Serie extendida con verdad histórica + placeholder para futuros
    series_ext = dfm[target].copy()
    results = []
    
    for t in future_times:
        # Features calendario
        row = {
            "hour": t.hour,
            "dow": t.dayofweek,
            "sin_hour": np.sin(2*np.pi*t.hour/24),
            "cos_hour": np.cos(2*np.pi*t.hour/24),
            "sin_dow":  np.sin(2*np.pi*t.dayofweek/7),
            "cos_dow":  np.cos(2*np.pi*t.dayofweek/7),
        }
        # Lags desde la serie extendida (que ya incluye predicciones previas)
        for L in lags:
            lag_time = t - pd.Timedelta(hours=L)
            if lag_time in series_ext.index:
                row[f"lag_{L}"] = series_ext.loc[lag_time]
            else:
                # Si no hay dato histórico, usar el último disponible
                row[f"lag_{L}"] = series_ext.iloc[-1]
        
        # Rolling con histórico reciente (hasta t-1)
        for w in wins:
            window_start = t - pd.Timedelta(hours=w)
            window_end = t - pd.Timedelta(hours=1)
            window = series_ext.loc[window_start:window_end]
            if len(window) > 0:
                row[f"roll_mean_{w}"] = window.mean()
                row[f"roll_std_{w}"]  = window.std()
            else:
                # Si no hay suficientes datos, usar valores del último dato
                row[f"roll_mean_{w}"] = series_ext.iloc[-1]
                row[f"roll_std_{w}"]  = 0
        
        X_row = pd.DataFrame([row], index=[t])
        y_hat = model.predict(X_row)[0]
        # Añadimos la predicción para que sirva de lag en el siguiente paso
        series_ext.loc[t] = y_hat
        results.append((t, y_hat))
    
    forecast_today = pd.Series({t: y for t, y in results}, name=f"forecast_{target}")
    print(f"\nPredicciones generadas para {len(forecast_today)} horas restantes del día")
    print(forecast_today)

# Guardar
with open('trained_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("✅ Modelo guardado en trained_model.pkl")