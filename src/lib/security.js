export function sanitizeInput(value) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export function canRequestAi(lastRequestAt) {
  if (!lastRequestAt) return true;
  return Date.now() - Number(lastRequestAt) > 1200;
}
