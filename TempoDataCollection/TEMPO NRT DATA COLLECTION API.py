import os
print(os.getenv("EARTHDATA_USERNAME"))
print(os.getenv("EARTHDATA_PASSWORD"))

import os
import re
import datetime as dt
import getpass

import numpy as np
import pandas as pd
import xarray as xr
import datatree as xrdt
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature

from cartopy.mpl.gridliner import LONGITUDE_FORMATTER, LATITUDE_FORMATTER
from xarray.plot.utils import label_from_attrs

from harmony import BBox, Client, Collection, Request
from harmony.config import Environment

harmony_client = Client(env=Environment.PROD, auth=(os.getenv("EARTHDATA_USERNAME"), os.getenv("EARTHDATA_PASSWORD")))

# Error due to the server crashout:

# --> 153     raise BadAuthentication(f'Authentication: An unknown error occurred during credential '
#     154                             f'validation: HTTP {response.status_code}')
# BadAuthentication: Authentication: An unknown error occurred during credential validation: HTTP 504

BBOX = BBox(-77.10, 38.86, -76.97, 38.94)
DATE_UTC   = dt.date(2024, 10, 15)
START_UTC  = dt.datetime(DATE_UTC.year, DATE_UTC.month, DATE_UTC.day, 11, 30, 0)
STOP_UTC   = dt.datetime(DATE_UTC.year, DATE_UTC.month, DATE_UTC.day, 22, 30, 0)
HOUR_START = dt.datetime(DATE_UTC.year, DATE_UTC.month, DATE_UTC.day, 12, 0, 0)
HOUR_STOP  = dt.datetime(DATE_UTC.year, DATE_UTC.month, DATE_UTC.day, 22, 0, 0)

TOL_MINUTES = 50          
QC_LEVELS   = [0, 1, None]

OUTPUT_ROOT = r"D:\NASA Hack\Test_3_Results Harmony\Hourly Data NRT API \DC_MULTI_" + DATE_UTC.isoformat()
os.makedirs(OUTPUT_ROOT, exist_ok=True)

_ts_regex = re.compile(r"_(\d{8}T\d{6})Z_")

#  Helpers for the collection of data
def _open_dtree(path):
    try:    return xrdt.open_datatree(path, engine="netcdf4")
    except: return xrdt.open_datatree(path, engine="h5netcdf")

def _extract_ts_from_name(path):
    m = _ts_regex.search(os.path.basename(path))
    if not m:
        raise ValueError(f"Timestamp not found: {path}")
    return pd.to_datetime(m.group(1), format="%Y%m%dT%H%M%S", utc=True)

def _mean_with_qc(dtree, value_var, qc_var, qc_levels):
    
    var = dtree[value_var]
    qf  = dtree[qc_var]
    for lvl in qc_levels:
        if lvl is None:
            m = float(var.mean().values)
            if np.isfinite(m):  return m, "noQC"
        elif lvl == 0:
            m = float(var.where(qf == 0).mean().values)
            if np.isfinite(m):  return m, "QC==0"
        else:
            m = float(var.where(qf <= lvl).mean().values)
            if np.isfinite(m):  return m, f"QC<={lvl}"
    return float("nan"), "NaN"

# Main fn
def process_collection(tag, collection_id, value_var, qc_var):
    print(f"\n=== Procesando {tag} (NRT) ===")
    try:
        out_dir = os.path.join(OUTPUT_ROOT, tag)
        os.makedirs(out_dir, exist_ok=True)

        request = Request(
            collection=Collection(id=collection_id),
            spatial=BBOX,
            temporal={"start": START_UTC, "stop": STOP_UTC},
            variables=[value_var, qc_var, "geolocation/latitude", "geolocation/longitude"],
        )

        job_id = harmony_client.submit(request)
        harmony_client.wait_for_processing(job_id, show_progress=True)

        futures = list(harmony_client.download_all(job_id, directory=out_dir, overwrite=True))
        files = [f.result() for f in futures]

        nc_files = [p for p in files if str(p).lower().endswith((".nc", ".nc4", ".cdf"))]
        if not nc_files:
            raise RuntimeError(f"No NetCDF files in {out_dir}")

        records = []
        for p in nc_files:
            dtree = _open_dtree(p)
            mean_val, qc_mode = _mean_with_qc(dtree, value_var, qc_var, QC_LEVELS)
            ts = _extract_ts_from_name(p)
            records.append({
                "time": ts,
                f"{tag}_vcol": mean_val,
                "qc_mode": qc_mode,
                "file": os.path.basename(p)
            })

        df_raw = pd.DataFrame(records).set_index("time").sort_index()
        csv_raw = os.path.join(out_dir, f"dc_{tag.lower()}_granules_raw.csv")
        df_raw.to_csv(csv_raw)
        print(f"[OK] CSV crudo guardado: {csv_raw}")

        # hourly data
        hours = pd.date_range(HOUR_START, HOUR_STOP, freq="h", tz="UTC")
        tol = pd.Timedelta(minutes=TOL_MINUTES)
        vals, src_ts, src_file, qc_mode = [], [], [], []

        for t in hours:
            window = df_raw.loc[t - tol : t + tol]
            if len(window):
                diffs = np.abs((window.index - t).to_numpy())
                idx = np.argmin(diffs)
                picked = window.iloc[idx]
                vals.append(picked[f"{tag}_vcol"])
                src_ts.append(window.index[idx])
                src_file.append(picked["file"])
                qc_mode.append(picked["qc_mode"])
            else:
                vals.append(np.nan); src_ts.append(pd.NaT); src_file.append(""); qc_mode.append("NA")

        df_hourly = pd.DataFrame({
            f"{tag}_vcol": vals,
            "source_time": src_ts,
            "source_file": src_file,
            "qc_mode": qc_mode,
            "filled": np.where(pd.notna(vals), 1, 0)
        }, index=hours)

        csv_hourly = os.path.join(out_dir, f"dc_{tag.lower()}_hourly.csv")
        df_hourly.to_csv(csv_hourly)
        print(f"[OK] CSV horario guardado: {csv_hourly}")

        return df_hourly

    except Exception as e:
        print(f"[ERROR] {tag} falló: {e}")
        return None


collections = [
    ("HCHO",  "C3685668884-LARC_CLOUD", "product/vertical_column",             "product/main_data_quality_flag"),   # NRT
    ("NO2",   "C3685668972-LARC_CLOUD", "product/vertical_column_troposphere", "product/main_data_quality_flag"),   # NRT
    ("CLDO4", "C3685669056-LARC_CLOUD", "product/cloud_pressure",              "product/processing_quality_flag"),  # NRT (si prefieres fracción: product/cloud_fraction)
]

dfs = {}
for tag, cid, var, qc in collections:
    df = process_collection(tag, cid, var, qc_var=qc)
    if df is not None:
        dfs[tag] = df[f"{tag}_vcol"]

if dfs:
    combined = pd.concat(dfs.values(), axis=1)
    combined_out = os.path.join(OUTPUT_ROOT, "dc_hourly_all_pollutants.csv")
    combined.to_csv(combined_out, date_format="%Y-%m-%d %H:%M:%S%z")
    print(f"\n[OK] COMBINED saved: {combined_out}")
else:
    print("\n[WARN] No se generaron datasets válidos.")

UNITS_MAP = {
    "HCHO":  "molecules/cm^2",
    "NO2":   "molecules/cm^2",
    "CLDO4": "hPa",
}