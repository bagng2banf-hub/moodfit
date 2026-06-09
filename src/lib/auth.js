const SESSION_KEY = "moodfit-session";

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signInWithEmail({ email, username }) {
  const session = {
    mode: "account",
    email,
    username: username || email,
    provider: "email",
    issuedAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

export async function createGuestSession() {
  const session = {
    mode: "guest",
    id: crypto.randomUUID(),
    issuedAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}
