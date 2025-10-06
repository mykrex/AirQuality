#import os
#import pickle
#from datetime import datetime
#
#import numpy as np
#import pandas as pd
#import requests
#
#from math import sqrt
#from sklearn.metrics import mean_absolute_error, mean_squared_error
#from sklearn.ensemble import HistGradientBoostingRegressor
#
#LAT, LON = 38.8951, -77.0364
#START_DATE = "2024-06-01"
#END_DATE   = "2025-10-03"
#TEMPO_CSV_PATH = r"C:\Users\Eydan\Downloads\2024-09_to_2025-09_hourly_def.csv"
#TARGET_OVERRIDE = None
#TEMPO_AVAIL_LAG_HOURS = 6
#TARGET_LAGS  = [1,2,3,6,12,24,48,72,168]
#TARGET_WINS  = [3,6,12,24,72]
#TEMPO_LAGS   = [0, 6, 24]
#TEST_DAYS = 30
#
#def fetch_openmeteo_aq(lat, lon, start, end):
#    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
#    params = {
#        "latitude": lat,
#        "longitude": lon,
#        "start_date": start,
#        "end_date": end,
#        "hourly": ",".join([
#            "pm10","pm2_5","carbon_monoxide","carbon_dioxide",
#            "nitrogen_dioxide","ozone","sulphur_dioxide",
#            "aerosol_optical_depth","dust","uv_index","uv_index_clear_sky"
#        ])
#    }
#    r = requests.get(url, params=params, timeout=60); r.raise_for_status()
#    data = r.json()
#    df = pd.DataFrame(data.get("hourly", {}))
#    if "time" not in df or df.empty:
#        raise ValueError("AQ: respuesta sin 'hourly/time'")
#    df["time"] = pd.to_datetime(df["time"])
#    df = df.set_index("time").sort_index()
#    df = df.tz_localize("UTC")
#    return df
#
#def fetch_openmeteo_weather(lat, lon, start, end):
#    url = "https://archive-api.open-meteo.com/v1/archive"
#    params = {
#        "latitude": lat,
#        "longitude": lon,
#        "start_date": start,
#        "end_date": end,
#        "hourly": ",".join([
#            "temperature_2m","relative_humidity_2m","rain","snowfall","snow_depth",
#            "soil_temperature_100_to_255cm","dew_point_2m","precipitation",
#            "cloud_cover","surface_pressure","wind_speed_10m",
#        ]),
#        "timezone": "UTC",
#    }
#    r = requests.get(url, params=params, timeout=60); r.raise_for_status()
#    data = r.json()
#    df = pd.DataFrame(data.get("hourly", {}))
#    if "time" not in df or df.empty:
#        raise ValueError("Weather: respuesta sin 'hourly/time'")
#    df["time"] = pd.to_datetime(df["time"])
#    df = df.set_index("time").sort_index()
#    df = df.tz_localize("UTC")
#    return df
#
#print("Descargando Open-Meteo AQ...")
#df_aq = fetch_openmeteo_aq(LAT, LON, START_DATE, END_DATE)
#print(f"AQ listo: {df_aq.index.min()} → {df_aq.index.max()} ({len(df_aq)} h)")
#
#print("Descargando Open-Meteo Weather...")
#df_wx = fetch_openmeteo_weather(LAT, LON, START_DATE, END_DATE)
#print(f"WX listo: {df_wx.index.min()} → {df_wx.index.max()} ({len(df_wx)} h)")
#
#tempo = pd.read_csv(TEMPO_CSV_PATH)
#if "time" in tempo.columns:
#    tempo["time"] = pd.to_datetime(tempo["time"], utc=True)
#    tempo = tempo.set_index("time")
#else:
#    try:
#        tempo.index = pd.to_datetime(tempo.index, utc=True)
#    except Exception:
#        raise ValueError("El CSV TEMPO debe tener columna 'time' o un índice interpretable como tiempo.")
#tempo = tempo.sort_index()
#
#rename_map = {
#    "HCHO_vcol": "HCHO_tempo",
#    "NO2_TROP": "NO2_tempo",
#    "NO2_vcol": "NO2_tempo",
#    "O3_vcol":  "O3_tempo",
#    "CLDO4_vcol":"CLDO4_tempo",
#}
#tempo = tempo.rename(columns=rename_map)
#for col in ["HCHO_tempo","NO2_tempo","O3_tempo","CLDO4_tempo"]:
#    if col not in tempo.columns:
#        tempo[col] = np.nan
#tempo = tempo[["HCHO_tempo","NO2_tempo","O3_tempo","CLDO4_tempo"]]
#
#base = pd.concat([df_aq, df_wx, tempo], axis=1).sort_index()
#base = base.asfreq("h")
#
#candidatos = ["pm2_5","pm10","ozone","nitrogen_dioxide"]
#target = TARGET_OVERRIDE if TARGET_OVERRIDE else next((c for c in candidatos if c in base.columns), None)
#if target is None:
#    raise ValueError("No encontré una columna objetivo típica (pm2_5/pm10/ozone/nitrogen_dioxide).")
#
#y = base[target].copy()
#y = y.ffill(limit=3).bfill(limit=1)
#
#dfm = pd.DataFrame({target: y})
#dfm["hour"] = dfm.index.hour
#dfm["dow"]  = dfm.index.dayofweek
#dfm["sin_hour"] = np.sin(2*np.pi*dfm["hour"]/24)
#dfm["cos_hour"] = np.cos(2*np.pi*dfm["hour"]/24)
#dfm["sin_dow"]  = np.sin(2*np.pi*dfm["dow"]/7)
#dfm["cos_dow"]  = np.cos(2*np.pi*dfm["dow"]/7)
#
#for L in TARGET_LAGS:
#    dfm[f"y_lag_{L}"] = dfm[target].shift(L)
#for w in TARGET_WINS:
#    dfm[f"y_roll_mean_{w}"] = dfm[target].rolling(w).mean()
#    dfm[f"y_roll_std_{w}"]  = dfm[target].rolling(w).std()
#
#tempo_avail = base[["HCHO_tempo","NO2_tempo","O3_tempo","CLDO4_tempo"]].shift(TEMPO_AVAIL_LAG_HOURS)
#for col in ["HCHO_tempo","NO2_tempo","O3_tempo","CLDO4_tempo"]:
#    for L in TEMPO_LAGS:
#        dfm[f"{col}_lag{L}"] = tempo_avail[col].shift(L)
#
#for met in ["temperature_2m","relative_humidity_2m","wind_speed_10m","surface_pressure","cloud_cover","precipitation"]:
#    if met in base.columns:
#        dfm[met] = base[met]
#
#dfm["y_next"] = dfm[target].shift(-1)
#dfm = dfm.dropna()
#dfm = dfm.fillna(method="ffill").fillna(method="bfill")
#
#split_date = dfm.index.max() - pd.Timedelta(days=TEST_DAYS)
#X_train = dfm.loc[dfm.index <= split_date].drop(columns=[target, "y_next"])
#y_train = dfm.loc[dfm.index <= split_date, "y_next"]
#X_test  = dfm.loc[dfm.index >  split_date].drop(columns=[target, "y_next"])
#y_test  = dfm.loc[dfm.index >  split_date, "y_next"]
#
#print(f"Target: {target}")
#print(f"Train: {X_train.index.min()} → {X_train.index.max()}   (n={len(X_train)})")
#print(f"Test : {X_test.index.min()}  → {X_test.index.max()}    (n={len(X_test)})")
#
#model = HistGradientBoostingRegressor(max_depth=6, learning_rate=0.05, max_iter=500, random_state=42)
#model.fit(X_train, y_train)
#
#pred = model.predict(X_test)
#mae  = mean_absolute_error(y_test, pred)
#rmse = sqrt(mean_squared_error(y_test, pred))
#print(f"\nMAE test: {mae:.3f} | RMSE test: {rmse:.3f}")
#
#now = pd.Timestamp(datetime.now(), tz="UTC")
#current_hour = now.replace(minute=0, second=0, microsecond=0)
#if now.minute > 0:
#    current_hour += pd.Timedelta(hours=1)
#end_of_day = current_hour.replace(hour=23)
#
#if current_hour > end_of_day:
#    print(f"\nNo quedan horas por predecir hoy (UTC).")
#    forecast_today = pd.Series(dtype=float, name=f"forecast_{target}")
#else:
#    hours_remaining = int((end_of_day - current_hour).total_seconds() / 3600) + 1
#    future_times = pd.date_range(current_hour, end_of_day, freq="h", tz="UTC")
#    series_ext = dfm[target].copy()
#    last_tempo_avail = tempo_avail.reindex(dfm.index.union(future_times)).ffill().iloc[-1]
#    last_meteo = base[["temperature_2m","relative_humidity_2m","wind_speed_10m",
#                       "surface_pressure","cloud_cover","precipitation"]].reindex(
#                           dfm.index.union(future_times)
#                       ).ffill().iloc[-1]
#    results = []
#    for t in future_times:
#        row = {}
#        row["hour"] = t.hour
#        row["dow"]  = t.dayofweek
#        row["sin_hour"] = np.sin(2*np.pi*t.hour/24)
#        row["cos_hour"] = np.cos(2*np.pi*t.hour/24)
#        row["sin_dow"]  = np.sin(2*np.pi*t.dayofweek/7)
#        row["cos_dow"]  = np.cos(2*np.pi*t.dayofweek/7)
#        for L in TARGET_LAGS:
#            lag_t = t - pd.Timedelta(hours=L)
#            row[f"y_lag_{L}"] = series_ext.asof(lag_t)
#        for w in TARGET_WINS:
#            w_start = t - pd.Timedelta(hours=w)
#            w_end   = t - pd.Timedelta(hours=1)
#            window = series_ext.loc[w_start:w_end]
#            if len(window) == 0:
#                row[f"y_roll_mean_{w}"] = series_ext.iloc[-1]
#                row[f"y_roll_std_{w}"]  = 0.0
#            else:
#                row[f"y_roll_mean_{w}"] = window.mean()
#                row[f"y_roll_std_{w}"]  = window.std()
#        for col in ["HCHO_tempo","NO2_tempo","O3_tempo","CLDO4_tempo"]:
#            base_time = t - pd.Timedelta(hours=TEMPO_AVAIL_LAG_HOURS)
#            val0 = tempo_avail[col].asof(base_time)
#            if pd.isna(val0):
#                val0 = last_tempo_avail[col]
#            row[f"{col}_lag0"] = val0
#            for L in [l for l in TEMPO_LAGS if l != 0]:
#                valL = tempo_avail[col].asof(base_time - pd.Timedelta(hours=L))
#                if pd.isna(valL):
#                    valL = val0
#                row[f"{col}_lag{L}"] = valL
#        for met in ["temperature_2m","relative_humidity_2m","wind_speed_10m",
#                    "surface_pressure","cloud_cover","precipitation"]:
#            if met in last_meteo.index:
#                row[met] = last_meteo[met]
#        X_row = pd.DataFrame([row], index=[t])
#        y_hat = model.predict(X_row)[0]
#        series_ext.loc[t] = y_hat
#        results.append((t, y_hat))
#    forecast_today = pd.Series({t: y for t, y in results}, name=f"forecast_{target}")
#    print(f"\nPronóstico generado para {len(forecast_today)} horas de hoy (UTC).")
#    print(forecast_today)
#
#with open('trained_model.pkl', 'wb') as f:
#    pickle.dump(model, f)
#print("\n✅ Modelo guardado en trained_model.pkl")
#
#dfm.to_csv("training_table_used.csv")
#print("✅ Tabla de entrenamiento guardada en training_table_used.csv")
