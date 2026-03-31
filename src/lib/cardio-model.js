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
    label: "Mau can bang",
    description: "Bo so lieu on dinh de demo nhanh flow du doan.",
    values: CARDIO_FORM_DEFAULTS,
  },
  elevated: {
    label: "Mau canh bao",
    description: "Ho so co nhieu yeu to nguy co de test trang thai canh bao.",
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
  { label: "Nu", value: 1 },
  { label: "Nam", value: 2 },
];

export const LEVEL_3_OPTIONS = [
  { label: "Binh thuong", value: 1 },
  { label: "Vuot nguong", value: 2 },
  { label: "Rat cao", value: 3 },
];

export const BINARY_OPTIONS = [
  { label: "Khong", value: 0 },
  { label: "Co", value: 1 },
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
      `Thieu hoac sai dinh dang truong: ${missingFields.join(", ")}`,
    );
  }

  if (payload.height !== null && payload.height <= 0) {
    issues.push("Chieu cao phai lon hon 0 cm.");
  }

  if (payload.weight !== null && payload.weight <= 0) {
    issues.push("Can nang phai lon hon 0 kg.");
  }

  if (payload.age_years !== null && payload.age_years <= 0) {
    issues.push("Tuoi phai lon hon 0.");
  }

  if (payload.ap_hi !== null && payload.ap_lo !== null && payload.ap_hi <= payload.ap_lo) {
    issues.push("Huyet ap tam thu phai lon hon huyet ap tam truong.");
  }

  if (
    payload.gender !== null &&
    !GENDER_OPTIONS.some((option) => option.value === payload.gender)
  ) {
    issues.push("Gioi tinh chi nhan 1 (Nu) hoac 2 (Nam).");
  }

  if (
    payload.cholesterol !== null &&
    !LEVEL_3_OPTIONS.some((option) => option.value === payload.cholesterol)
  ) {
    issues.push("Cholesterol chi nhan cac muc 1, 2, 3.");
  }

  if (
    payload.gluc !== null &&
    !LEVEL_3_OPTIONS.some((option) => option.value === payload.gluc)
  ) {
    issues.push("Glucose chi nhan cac muc 1, 2, 3.");
  }

  if (issues.length > 0) {
    const error = new Error("Payload dau vao khong hop le.");
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
    return "San sang nhan du lieu de du doan nguy co tim mach.";
  }

  return result.prediction === 1
    ? "Xac suat vuot nguong canh bao. Nen uu tien danh gia them voi nhan vien y te."
    : "Xac suat hien tai dang nam duoi nguong canh bao cua model.";
}
