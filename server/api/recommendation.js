import { sanitizeInput } from "../../src/lib/security.js";

const WINDOW_MS = 60_000;
const LIMIT = 20;
const buckets = new Map();

export function checkRateLimit(key) {
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, startedAt: now };
  if (now - bucket.startedAt > WINDOW_MS) {
    bucket.count = 0;
    bucket.startedAt = now;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= LIMIT;
}

export async function buildRecommendationRequest(request) {
  const body = await request.json();
  return {
    mood: sanitizeInput(body.mood),
    weather: sanitizeInput(body.weather),
    schedule: sanitizeInput(body.schedule),
    eventType: sanitizeInput(body.eventType),
    aesthetic: sanitizeInput(body.aesthetic),
    wardrobe: Array.isArray(body.wardrobe) ? body.wardrobe.slice(0, 80) : [],
  };
}

export async function handleRecommendation(request) {
  const clientKey = request.headers.get("x-session-id") || "anonymous";
  if (!checkRateLimit(clientKey)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const payload = await buildRecommendationRequest(request);
  return Response.json({
    status: "ready_for_provider",
    payload,
    note: "Connect OpenAI, Supabase Edge Functions, Firebase Functions, or a private server here. Keep provider API keys in environment variables only.",
  });
}
