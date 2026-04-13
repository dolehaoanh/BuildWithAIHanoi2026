/**
 * GET /api/health
 * Tests the Gemini REST API directly (no SDK) with a minimal prompt.
 * Reports per-model status so you can see exactly which models work.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash", "gemini-1.0-pro"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      status: "error",
      code: "NO_API_KEY",
      message: "GEMINI_API_KEY environment variable is not set in Vercel.",
      keyPrefix: null,
    });
  }

  const keyPrefix = API_KEY.substring(0, 8) + "...";
  const results = [];

  for (const modelName of MODELS) {
    const url = `${GEMINI_BASE}/${modelName}:generateContent?key=${API_KEY}`;
    try {
      const fetchRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
        }),
      });

      const json = await fetchRes.json();

      if (!fetchRes.ok) {
        const googleMsg = json?.error?.message || JSON.stringify(json);
        let code = `HTTP_${fetchRes.status}`;
        if (fetchRes.status === 429 || googleMsg.includes("quota")) code = "QUOTA_EXCEEDED";
        else if (fetchRes.status === 403) code = "INVALID_KEY";
        else if (fetchRes.status === 404) code = "MODEL_NOT_FOUND";
        results.push({ model: modelName, status: "error", code, detail: googleMsg.substring(0, 200) });
      } else {
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        results.push({ model: modelName, status: "ok", response: text });
      }
    } catch (err) {
      results.push({ model: modelName, status: "error", code: "FETCH_ERROR", detail: err.message });
    }
  }

  const anyOk = results.some((r) => r.status === "ok");
  return res.status(anyOk ? 200 : 503).json({
    status: anyOk ? "healthy" : "degraded",
    keyPrefix,
    models: results,
    timestamp: new Date().toISOString(),
  });
}
