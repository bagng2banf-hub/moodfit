export const CLIENT_STATE_VERSION = 3;

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

export function sanitizeInput(value, maxLength = 600) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(CONTROL_CHARS, "")
    .replace(/[<>`{}$\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeIdentifier(value, maxLength = 32) {
  return sanitizeInput(value, maxLength)
    .replace(/[^a-zA-Z0-9가-힣_.-]/g, "")
    .slice(0, maxLength);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export function isStrongPassword(value) {
  const password = String(value || "");
  return password.length >= 8 && password.length <= 72 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

export function canRequestAi(lastRequestAt) {
  if (!lastRequestAt) return true;
  return Date.now() - Number(lastRequestAt) > 1200;
}

export function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

export function createSessionId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function pruneClientState(state = {}) {
  const safe = typeof state === "object" && state ? state : {};
  return {
    stateVersion: CLIENT_STATE_VERSION,
    language: safe.language === "en" ? "en" : "ko",
    theme: ["white", "dark", "wood"].includes(safe.theme) ? safe.theme : "white",
    mood: sanitizeInput(safe.mood || "moodLuxury", 48),
    wardrobe: Array.isArray(safe.wardrobe) ? safe.wardrobe.slice(0, 120) : [],
    fit: safe.fit && typeof safe.fit === "object" ? safe.fit : {},
    savedLooks: Array.isArray(safe.savedLooks) ? safe.savedLooks.slice(0, 80) : [],
    brief: sanitizeInput(safe.brief, 800),
    weather: sanitizeInput(safe.weather || "soft rain", 120),
    schedule: sanitizeInput(safe.schedule || "daily", 120),
    eventType: sanitizeInput(safe.eventType || "daily", 80),
    aesthetic: sanitizeInput(safe.aesthetic || "soft casual", 120),
    bodyProfile: safe.bodyProfile && typeof safe.bodyProfile === "object" ? safe.bodyProfile : {},
    game: safe.game && typeof safe.game === "object" ? safe.game : {},
    profileName: sanitizeInput(safe.profileName || "무드핏 스타일러", 40),
    profilePhoto: typeof safe.profilePhoto === "string" && safe.profilePhoto.startsWith("data:image/") ? safe.profilePhoto.slice(0, 1_500_000) : "",
    homeBanner: ["dressing", "closet"].includes(safe.homeBanner) ? safe.homeBanner : "dressing",
    viewMode: safe.viewMode === "mobile" ? "mobile" : "desktop",
  };
}
