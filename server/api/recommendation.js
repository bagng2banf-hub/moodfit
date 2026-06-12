import { sanitizeInput } from "../../src/lib/security.js";

const WINDOW_MS = 60_000;
const LIMIT = 12;
const MAX_WARDROBE_ITEMS = 60;
const buckets = new Map();

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers || {}) },
  });
}

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
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("unsupported_content_type");
  }
  const body = await request.json();
  const wardrobe = Array.isArray(body.wardrobe) ? body.wardrobe.slice(0, MAX_WARDROBE_ITEMS).map(sanitizeWardrobeItem) : [];
  return {
    mood: sanitizeInput(body.mood, 80),
    weather: sanitizeInput(body.weather, 120),
    schedule: sanitizeInput(body.schedule, 120),
    eventType: sanitizeInput(body.eventType, 80),
    aesthetic: sanitizeInput(body.aesthetic, 120),
    wardrobe,
  };
}

function sanitizeWardrobeItem(item = {}) {
  return {
    id: sanitizeInput(item.id, 80),
    name: sanitizeInput(item.name, 120),
    category: sanitizeInput(item.category, 40),
    subcategory: sanitizeInput(item.subcategory || item.clothingType, 80),
    fitType: sanitizeInput(item.fitType, 60),
    fabric: sanitizeInput(item.fabric, 60),
    pattern: sanitizeInput(item.pattern, 60),
    season: sanitizeInput(item.season, 40),
    color: sanitizeInput(item.color || item.primaryColor, 24),
    vibe: sanitizeInput(item.vibe, 80),
  };
}

export async function handleRecommendation(request) {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
  }

  const clientKey = request.headers.get("x-session-id") || "anonymous";
  if (!checkRateLimit(clientKey)) {
    return json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const payload = await buildRecommendationRequest(request);
    return json({
      status: "ready_for_provider",
      payload,
      note: "Provider API keys must stay in server environment variables only.",
    });
  } catch {
    return json({ error: "bad_request" }, { status: 400 });
  }
}
