import dotenv from "dotenv";

dotenv.config();

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ORGAN_TYPES = [
  "Kidney",
  "Liver",
  "Heart",
  "Lungs",
  "Pancreas",
  "Cornea",
  "Bone Marrow",
  "Other",
];

function parseJsonEnv(name, fallback) {
  try {
    if (!process.env[name]) return fallback;
    const parsed = JSON.parse(process.env[name]);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

export function getBloodThresholds() {
  const defaultThreshold = Number(process.env.SHORTAGE_THRESHOLD_DEFAULT_BLOOD || 3);
  const overrides = parseJsonEnv("SHORTAGE_THRESHOLD_BLOOD_JSON", {});
  const thresholds = {};
  for (const bt of BLOOD_TYPES) {
    thresholds[bt] = Number(overrides?.[bt] ?? defaultThreshold);
  }
  return thresholds;
}

export function getOrganThreshold() {
  return Number(process.env.SHORTAGE_THRESHOLD_ORGAN || 1);
}

export function getFutureShortageDays() {
  return Number(process.env.FUTURE_SHORTAGE_DAYS || 3);
}

export function getFutureShortageLookbackDays() {
  return Number(process.env.FUTURE_SHORTAGE_LOOKBACK_DAYS || 7);
}

export { BLOOD_TYPES, ORGAN_TYPES };


