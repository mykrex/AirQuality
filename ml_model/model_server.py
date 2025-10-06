from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import pandas as pd
import numpy as np
import pickle
import uvicorn
from datetime import datetime

app = FastAPI()

# Variables globales del modelo
model = None
lags = [1,2,3,6,12,24,48,72,168]
wins = [3,6,12,24,72]
target = "pm2_5"

# Cargar modelo al iniciar
try:
    with open('trained_model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ Modelo cargado correctamente")
except Exception as e:
    print(f"⚠️ Error cargando modelo: {e}")

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    hours_ahead: int = 24

@app.post("/predict")
async def predict_air_quality(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no entrenado")
    
    # 1. Obtener datos actuales de Open-Meteo
    current_data = await get_current_air_quality(req.latitude, req.longitude)
    
    if not current_data:
        raise HTTPException(status_code=500, detail="No se pudieron obtener datos actuales")
    
    current_pm25 = current_data.get("pm2_5", 0)
    current_o3 = current_data.get("ozone", 0)
    current_no2 = current_data.get("nitrogen_dioxide", 0)
    current_co = current_data.get("carbon_monoxide", 0)
    current_time = pd.Timestamp.now(tz='UTC')
    
    # 2. Obtener histórico reciente para lags (últimas 168 horas = 7 días)
    historical = await get_historical_data(
        req.latitude, 
        req.longitude,
        hours_back=168
    )
    
    # 3. Crear serie histórica
    series_ext = pd.Series(historical, name=target)
    series_ext.loc[current_time] = current_pm25
    
    # 4. Generar predicciones
    predictions = []
    future_times = pd.date_range(
        current_time + pd.Timedelta(hours=1),
        periods=req.hours_ahead,
        freq="h",  # Cambiado de "H" a "h"
        tz='UTC'
    )
    
    for i, t in enumerate(future_times):
        features = prepare_features(t, series_ext)
        X_row = pd.DataFrame([features], index=[t])
        
        y_hat = model.predict(X_row)[0]
        y_hat = max(0, y_hat)  # No puede ser negativo
        
        # Añadir a la serie para próximas predicciones
        series_ext.loc[t] = y_hat
        
        predictions.append({
            "hours_ahead": i + 1,
            "pm25": round(float(y_hat), 2),
            "aqi": pm25_to_aqi(y_hat),
            "timestamp": t.isoformat()
        })
    
    return {
        "success": True,
        "location": {"lat": req.latitude, "lon": req.longitude},
        "current_pm25": round(current_pm25, 2),
        "current_aqi": pm25_to_aqi(current_pm25),
        "current_o3": round(current_o3, 1),
        "current_no2": round(current_no2, 1),
        "current_co": round(current_co, 1),
        "predictions": predictions
    }

def prepare_features(t, series_ext):
    """Prepara features según el entrenamiento"""
    features = {
        "hour": t.hour,
        "dow": t.dayofweek,
        "sin_hour": np.sin(2*np.pi*t.hour/24),
        "cos_hour": np.cos(2*np.pi*t.hour/24),
        "sin_dow": np.sin(2*np.pi*t.dayofweek/7),
        "cos_dow": np.cos(2*np.pi*t.dayofweek/7),
    }
    
    # Lags
    for L in lags:
        lag_time = t - pd.Timedelta(hours=L)
        # Redondear a hora completa
        lag_time = lag_time.floor('h')
        
        if lag_time in series_ext.index:
            features[f"lag_{L}"] = series_ext.loc[lag_time]
        else:
            features[f"lag_{L}"] = series_ext.iloc[-1] if len(series_ext) > 0 else 0
    
    # Rolling windows
    for w in wins:
        window_start = t - pd.Timedelta(hours=w)
        window_end = t - pd.Timedelta(hours=1)
        # Redondear a horas completas
        window_start = window_start.floor('h')
        window_end = window_end.floor('h')
        
        try:
            # Usar fechas exactas disponibles en el índice
            available_times = series_ext.loc[window_start:window_end]
            if len(available_times) > 0:
                features[f"roll_mean_{w}"] = available_times.mean()
                features[f"roll_std_{w}"] = available_times.std()
            else:
                features[f"roll_mean_{w}"] = series_ext.iloc[-1] if len(series_ext) > 0 else 0
                features[f"roll_std_{w}"] = 0
        except:
            features[f"roll_mean_{w}"] = series_ext.iloc[-1] if len(series_ext) > 0 else 0
            features[f"roll_std_{w}"] = 0
    
    return features

async def get_current_air_quality(lat, lon):
    """Obtiene calidad del aire actual"""
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    vars_ = ",".join([
        "pm10","pm2_5","carbon_monoxide","nitrogen_dioxide",
        "ozone","sulphur_dioxide"
    ])
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": vars_,
        "timezone": "auto"
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data.get("current", {})
    except Exception as e:
        print(f"Error obteniendo datos actuales: {e}")
        return None

async def get_historical_data(lat, lon, hours_back=168):
    """Obtiene datos históricos de las últimas N horas"""
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    
    now = datetime.now()
    end_date = now.strftime("%Y-%m-%d")
    start = now - pd.Timedelta(hours=hours_back)
    start_date = start.strftime("%Y-%m-%d")
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "pm2_5",
        "timezone": "UTC"
    }
    
    try:
        r = requests.get(url, params=params, timeout=60)
        r.raise_for_status()
        data = r.json()
        
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        values = hourly.get("pm2_5", [])
        
        # Crear serie temporal
        df = pd.DataFrame({"time": times, "pm2_5": values})
        df["time"] = pd.to_datetime(df["time"])
        df = df.set_index("time")
        
        return df["pm2_5"].to_dict()
    except Exception as e:
        print(f"Error obteniendo histórico: {e}")
        return {}

def pm25_to_aqi(pm25):
    """Convierte PM2.5 a AQI según estándares EPA"""
    if pm25 <= 12:
        return int((pm25 / 12) * 50)
    elif pm25 <= 35.4:
        return int(50 + ((pm25 - 12) / 23.4) * 50)
    elif pm25 <= 55.4:
        return int(100 + ((pm25 - 35.4) / 20) * 50)
    elif pm25 <= 150.4:
        return int(150 + ((pm25 - 55.4) / 94.6) * 100)
    elif pm25 <= 250.4:
        return int(200 + ((pm25 - 150.4) / 100) * 100)
    else:
        return int(300 + ((pm25 - 250.4) / 99.6) * 100)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Iniciando servidor ML en puerto 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)