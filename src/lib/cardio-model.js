export const CARDIO_THRESHOLD = 0.3487778306007385;

export const CARDIO_FIELD_ORDER = [
  "gender",
  "height",
  "weight",
  "ap_hi",
  "ap_lo",
  "cholesterol",
  "gluc",
  "smoke",
  "alco",
  "active",
  "age_years",
  "bmi",
  "pulse_pressure",
  "mean_arterial_pressure",
];

export const CARDIO_FORM_DEFAULTS = {
  gender: 2,
  height: 170,
  weight: 75,
  ap_hi: 120,
  ap_lo: 80,
  cholesterol: 1,
  gluc: 1,
  smoke: 0,
  alco: 0,
  active: 1,
  age_years: 49.8,
};

export const CARDIO_SAMPLE_PROFILES = {
  baseline: {
    label: "Balanced sample",
    description: "Stable values for a quick prediction-flow demo.",
    values: CARDIO_FORM_DEFAULTS,
  },
  elevated: {
    label: "Alert sample",
    description: "A profile with multiple risk factors to test the alert state.",
    values: {
      gender: 1,
      height: 158,
      weight: 84,
      ap_hi: 165,
      ap_lo: 100,
      cholesterol: 3,
      gluc: 2,
      smoke: 1,
      alco: 1,
      active: 0,
      age_years: 61.4,
    },
  },
};

export const GENDER_OPTIONS = [
  { label: "Female", value: 1 },
  { label: "Male", value: 2 },
];

export const LEVEL_3_OPTIONS = [
  { label: "Normal", value: 1 },
  { label: "Above threshold", value: 2 },
  { label: "Very high", value: 3 },
];

export const BINARY_OPTIONS = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

export function roundTo(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseBinary(value) {
  if (value === true || value === "true") {
    return 1;
  }

  if (value === false || value === "false") {
    return 0;
  }

  const numericValue = parseNumber(value);

  if (numericValue === 0 || numericValue === 1) {
    return numericValue;
  }

  return null;
}

export function deriveCardioMetrics(values = {}) {
  const height = parseNumber(values.height);
  const weight = parseNumber(values.weight);
  const systolic = parseNumber(values.ap_hi);
  const diastolic = parseNumber(values.ap_lo);

  return {
    bmi:
      height && weight
        ? roundTo(weight / ((height / 100) ** 2), 2)
        : null,
    pulse_pressure:
      systolic !== null && diastolic !== null
        ? roundTo(systolic - diastolic, 0)
        : null,
    mean_arterial_pressure:
      systolic !== null && diastolic !== null
        ? roundTo((systolic + 2 * diastolic) / 3, 2)
        : null,
  };
}

export function buildCardioPayload(values = {}) {
  const normalized = {
    gender: parseNumber(values.gender),
    height: parseNumber(values.height),
    weight: parseNumber(values.weight),
    ap_hi: parseNumber(values.ap_hi),
    ap_lo: parseNumber(values.ap_lo),
    cholesterol: parseNumber(values.cholesterol),
    gluc: parseNumber(values.gluc),
    smoke: parseBinary(values.smoke),
    alco: parseBinary(values.alco),
    active: parseBinary(values.active),
    age_years: parseNumber(values.age_years),
  };

  const derived = deriveCardioMetrics(normalized);
  const payload = {
    ...normalized,
    ...derived,
  };

  const missingFields = CARDIO_FIELD_ORDER.filter(
    (field) => payload[field] === null,
  );
  const issues = [];

  if (missingFields.length > 0) {
    issues.push(
      `Missing or invalid fields: ${missingFields.join(", ")}`,
    );
  }

  if (payload.height !== null && payload.height <= 0) {
    issues.push("Height must be greater than 0 cm.");
  }

  if (payload.weight !== null && payload.weight <= 0) {
    issues.push("Weight must be greater than 0 kg.");
  }

  if (payload.age_years !== null && payload.age_years <= 0) {
    issues.push("Age must be greater than 0.");
  }

  if (payload.ap_hi !== null && payload.ap_lo !== null && payload.ap_hi <= payload.ap_lo) {
    issues.push(
      "Systolic blood pressure must be greater than diastolic blood pressure.",
    );
  }

  if (
    payload.gender !== null &&
    !GENDER_OPTIONS.some((option) => option.value === payload.gender)
  ) {
    issues.push("Gender only accepts 1 (Female) or 2 (Male).");
  }

  if (
    payload.cholesterol !== null &&
    !LEVEL_3_OPTIONS.some((option) => option.value === payload.cholesterol)
  ) {
    issues.push("Cholesterol only accepts levels 1, 2, and 3.");
  }

  if (
    payload.gluc !== null &&
    !LEVEL_3_OPTIONS.some((option) => option.value === payload.gluc)
  ) {
    issues.push("Glucose only accepts levels 1, 2, and 3.");
  }

  if (issues.length > 0) {
    const error = new Error("The input payload is invalid.");
    error.details = issues;
    throw error;
  }

  return payload;
}

export function getRiskTone(probability = 0, threshold = CARDIO_THRESHOLD) {
  if (probability >= threshold + 0.18) {
    return "critical";
  }

  if (probability >= threshold) {
    return "watch";
  }

  return "stable";
}

export function describePrediction(result) {
  if (!result) {
    return "Ready to receive data for cardiovascular risk prediction.";
  }

  return result.prediction === 1
    ? "The predicted probability is above the alert threshold. A follow-up medical evaluation is recommended."
    : "The current predicted probability is below the model alert threshold.";
}
