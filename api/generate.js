/**
 * POST /api/generate
 * Calls Gemini REST API directly via fetch (no SDK dependency).
 * Falls back through models if one is unavailable or quota-exceeded.
 */

const MODEL_CHAIN = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
  "gemini-1.0-pro",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(apiKey, modelName, promptText) {
  const url = `${GEMINI_BASE}/${modelName}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    // Attach the HTTP status and Google error code to the thrown error
    const googleError = json?.error?.message || JSON.stringify(json);
    const err = new Error(googleError);
    err.httpStatus = res.status;
    err.googleCode = json?.error?.status || "";
    throw err;
  }

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from model");
  return text;
}

export default async function handler(req, res) {
  console.log("Handler started. Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({
      error: "API Key not configured. Check the GEMINI_API_KEY environment variable in Vercel.",
      code: "NO_API_KEY",
    });
  }

  console.log("API key prefix:", API_KEY.substring(0, 8) + "...");

  const { age, weight, height, bodyfat, style } = req.body;

  const promptText = `
    Act as an elite sports scientist and soccer performance coach. 
    Generate a comprehensive elite-level performance protocol for a player with these biometrics:
    - Age: ${age}
    - Weight: ${weight}kg
    - Height: ${height}cm
    - Body Fat: ${bodyfat}%
    - Desired Play-style: ${style}

    Task:
    1. Identify world-class elite soccer players with similar physical profiles and play-style as benchmarks.
    2. Suggest scientific training loads (Strength, Speed, Technical).
    3. Provide a nutrition plan to reach ideal elite body measurements.
    4. Include sleep and recovery protocols.

    Format output in clean HTML:
    - Use <h4> for section titles.
    - Use <p> for text.
    - Use <ul> and <li> for points.
    - Use <strong> for emphasis.
    DO NOT use Markdown code blocks. Output raw HTML only.
  `;

  let lastError = null;

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`Trying model: ${modelName}`);
      const text = await callGemini(API_KEY, modelName, promptText);
      const cleanHtml = text.replace(/```html|```/g, "");

      console.log(`Success with model: ${modelName}`);
      return res.status(200).json({ html: cleanHtml, model: modelName });
    } catch (err) {
      const status = err.httpStatus || 0;
      const msg = err.message || "";
      console.warn(`Model ${modelName} failed (HTTP ${status}):`, msg.substring(0, 150));

      lastError = err;

      // Retry on: quota/rate-limit (429) or model unavailable (404)
      const isRetryable = status === 429 || status === 404 ||
        msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("not found") || msg.includes("MODEL_NOT_FOUND");

      if (isRetryable) continue;

      // Auth/permission errors — bail immediately, other models won't help
      if (status === 400 || status === 403) break;
    }
  }

  // Classify the final error for the frontend
  const status = lastError?.httpStatus || 0;
  const msg = lastError?.message || "";

  if (status === 429 || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return res.status(429).json({
      error: "All AI models are currently at quota. Enable billing in Google AI Studio or try again later.",
      code: "QUOTA_EXCEEDED",
      detail: msg.substring(0, 300),
    });
  }

  if (status === 403 || msg.includes("API key not valid") || msg.includes("PERMISSION_DENIED")) {
    return res.status(403).json({
      error: "The API key is invalid or revoked. Generate a new key in Google AI Studio and update the GEMINI_API_KEY variable in Vercel.",
      code: "INVALID_KEY",
      detail: msg.substring(0, 300),
    });
  }

  if (status === 404 || msg.includes("not found")) {
    return res.status(404).json({
      error: "No AI models were available. Please try again later.",
      code: "MODEL_NOT_FOUND",
      detail: msg.substring(0, 300),
    });
  }

  return res.status(500).json({
    error: "An unexpected error occurred. Please try again.",
    code: "UNKNOWN",
    detail: msg.substring(0, 300),
  });
}
