import json
import sys
from pathlib import Path

import joblib
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT_DIR / "artifacts" / "models" / "cardio_xgboost_final.joblib"
METADATA_PATH = ROOT_DIR / "artifacts" / "metrics" / "cardio_xgboost_final_metadata.json"


def load_input():
    raw_payload = sys.stdin.read().strip()
    if not raw_payload and len(sys.argv) > 1:
        raw_payload = sys.argv[1]

    if not raw_payload:
        raise ValueError("Khong nhan duoc JSON input.")

    return json.loads(raw_payload)


def main():
    payload = load_input()

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Khong tim thay model tai {MODEL_PATH}")

    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Khong tim thay metadata tai {METADATA_PATH}")

    model = joblib.load(MODEL_PATH)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

    feature_order = list(model.feature_names_in_)
    frame = pd.DataFrame(
        [{feature: payload[feature] for feature in feature_order}]
    )

    probability_cardio = float(model.predict_proba(frame)[0][1])
    threshold_used = float(metadata["selected_threshold"])
    prediction = int(probability_cardio >= threshold_used)

    result = {
        "model": metadata.get("final_model_name", "XGBoost"),
        "probability_cardio": round(probability_cardio, 6),
        "prediction": prediction,
        "threshold_used": threshold_used,
    }

    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
