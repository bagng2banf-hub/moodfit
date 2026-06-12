import { createSessionId, isStrongPassword, sanitizeIdentifier, safeJsonParse } from "./security";

const SESSION_KEY = "moodfit-session";

export function loadSession() {
  const session = safeJsonParse(localStorage.getItem(SESSION_KEY), null);
  if (!session || typeof session !== "object") return null;
  return {
    mode: session.mode === "account" ? "account" : "guest",
    id: sanitizeIdentifier(session.id || createSessionId(), 64),
    username: sanitizeIdentifier(session.username || "guest", 32),
    provider: session.provider === "local" ? "local" : "guest",
    issuedAt: session.issuedAt || new Date().toISOString(),
  };
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signInWithEmail({ username, password }) {
  const safeUsername = sanitizeIdentifier(username, 32);
  if (safeUsername.length < 3) throw new Error("invalid_username");
  if (!isStrongPassword(password)) throw new Error("weak_password");
  const session = {
    mode: "account",
    id: createSessionId(),
    username: safeUsername,
    provider: "local",
    issuedAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

export async function createGuestSession() {
  const session = {
    mode: "guest",
    id: createSessionId(),
    username: "guest",
    provider: "guest",
    issuedAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}
