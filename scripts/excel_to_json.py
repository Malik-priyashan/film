#!/usr/bin/env python3
"""Convert the master Excel sheet into movies.json using pandas.

This script lets you keep "training" the dataset inside Excel while still using
pandas for data manipulation. Configure the Excel source with environment
variables (see .env.example) and run:

    pip install -r scripts/requirements.txt
    npm run ingest:excel

It will generate/overwrite data/movies.csv and data/movies.json.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError as exc:  # pragma: no cover - guidance for missing deps
    sys.exit("pandas is required. Install dependencies with: pip install -r scripts/requirements.txt")

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    sys.exit("python-dotenv is required. Install with: pip install -r scripts/requirements.txt")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
ENV_PATHS = [PROJECT_ROOT / ".env", PROJECT_ROOT / ".env.local"]

for env_path in ENV_PATHS:
    if env_path.exists():
        load_dotenv(env_path, override=True)

EXCEL_PATH = os.getenv("MOVIE_EXCEL_PATH")
EXCEL_URL = os.getenv("MOVIE_EXCEL_URL")
SHEET = os.getenv("MOVIE_EXCEL_SHEET", "Sheet1")
CSV_PATH = os.getenv("MOVIE_CSV_PATH")

if CSV_PATH:
    csv_path = Path(CSV_PATH)
    if not csv_path.is_absolute():
        csv_path = PROJECT_ROOT / csv_path
else:
    csv_path = DATA_DIR / "movies.csv"

json_path = os.getenv("MOVIE_JSON_PATH")
if json_path:
    json_path = Path(json_path)
    if not json_path.is_absolute():
        json_path = PROJECT_ROOT / json_path
else:
    json_path = DATA_DIR / "movies.json"

source = EXCEL_PATH or EXCEL_URL
if not source:
    sys.exit(
        "Set MOVIE_EXCEL_PATH (local file) or MOVIE_EXCEL_URL (download link) in .env/.env.local before running this script."
    )

DATA_DIR.mkdir(parents=True, exist_ok=True)
csv_path.parent.mkdir(parents=True, exist_ok=True)
json_path.parent.mkdir(parents=True, exist_ok=True)

try:
    sheet_identifier = int(SHEET)
except ValueError:
    sheet_identifier = SHEET

print(f"📥 Reading Excel data from: {source} (sheet={SHEET})")
df = pd.read_excel(source, sheet_name=sheet_identifier)
print(f"   Rows loaded: {len(df)}")

COLUMN_MAP = {
    "movieName": "Movie Name",
    "mainActress": "Main Actress",
    "cast": "Cast",
    "year": "Year",
    "language": "Language",
    "imdbRating": "IMDb_Rating",
    "confidence": "Confidence",
}

split_pattern = re.compile(r"[,|]")


def normalize_list(value):
    if pd.isna(value):
        return []
    if isinstance(value, list):
        return [item for item in (str(v).strip() for v in value) if item]
    if isinstance(value, str):
        return [item for item in (part.strip() for part in split_pattern.split(value)) if item]
    return []


def to_number(value):
    if pd.isna(value):
        return None
    try:
        number = int(value)
    except (ValueError, TypeError):
        try:
            number = float(value)
        except (ValueError, TypeError):
            return None
    return number


records = []
for _, row in df.iterrows():
    movie_name = str(row.get(COLUMN_MAP["movieName"], ""))
    if not movie_name or not movie_name.strip():
        continue

    record = {
        "movieName": movie_name.strip(),
        "mainActress": normalize_list(row.get(COLUMN_MAP["mainActress"])),
        "cast": normalize_list(row.get(COLUMN_MAP["cast"])),
        "year": to_number(row.get(COLUMN_MAP["year"])),
        "language": normalize_list(row.get(COLUMN_MAP["language"])),
        "imdbRating": to_number(row.get(COLUMN_MAP["imdbRating"])),
        "confidence": str(row.get(COLUMN_MAP["confidence"], "UNKNOWN")) or "UNKNOWN",
    }
    records.append(record)

if not records:
    sys.exit("No valid movie rows were found. Ensure the sheet headers match the expected names.")

print(f"🧮 Processed {len(records)} movies. Writing outputs...")

processed_df = pd.DataFrame(records)
processed_df.to_csv(csv_path, index=False)
print(f"   ✅ CSV written to {csv_path.relative_to(PROJECT_ROOT)}")

with json_path.open("w", encoding="utf-8") as fh:
    json.dump(records, fh, indent=2, ensure_ascii=False)
print(f"   ✅ JSON written to {json_path.relative_to(PROJECT_ROOT)}")

print("🎉 Excel ingestion complete. Restart the dev server (if running) to reload data.")
