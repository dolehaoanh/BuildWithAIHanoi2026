import { GoogleGenerativeAI } from "@google/generative-ai";

// Model fallback chain — tries each in order until one succeeds
// gemini-1.5-flash is first as the most reliably available on free/new keys
const MODEL_CHAIN = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
];

export default async function handler(req, res) {
  console.log("Handler started. Method:", req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { age, weight, height, bodyfat, style } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment");
      return res.status(500).json({
        error: 'API Key not configured on server. Please check Vercel environment variables.',
        code: 'NO_API_KEY'
      });
    }

    // Log first 8 chars of key for debugging (safe — not the full key)
    console.log("Using API key prefix:", API_KEY.substring(0, 8) + "...");

    const genAI = new GoogleGenerativeAI(API_KEY);

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
        DO NOT use Markdown code blocks. Output raw HTML.
    `;

    // Try each model in the fallback chain
    let lastError = null;
    for (const modelName of MODEL_CHAIN) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        const cleanHtml = text.replace(/```html|```/g, '');

        console.log(`Success with model: ${modelName}`);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ html: cleanHtml, model: modelName });
      } catch (modelError) {
        const msg = modelError.message || '';
        console.warn(`Model ${modelName} failed:`, msg.substring(0, 120));

        // Continue the chain for quota/rate-limit OR model-not-found errors
        const isRetryable = (
          msg.includes('429') || msg.includes('quota') ||
          msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('404') || msg.includes('not found') || msg.includes('MODEL_NOT_FOUND')
        );
        if (isRetryable) {
          lastError = modelError;
          continue; // try next model
        }

        // For auth/key errors, bail out immediately — fallback won't help
        throw modelError;
      }
    }

    // All models exhausted — throw last error
    throw lastError;

  } catch (error) {
    console.error("Gemini Backend Error:", error);

    // Classify the error for the frontend
    let statusCode = 500;
    let errorCode = 'UNKNOWN';
    let userMessage = 'An unexpected error occurred. Please try again.';

    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED')) {
      statusCode = 429;
      errorCode = 'QUOTA_EXCEEDED';
      userMessage = 'All AI models are currently at their quota limit. This usually means the API key is on the free tier. Please enable billing in Google AI Studio or wait a few minutes and retry.';
    } else if (msg.includes('403') || msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED')) {
      statusCode = 403;
      errorCode = 'INVALID_KEY';
      userMessage = 'The API key is invalid or has been revoked. Please generate a new key from Google AI Studio and update the GEMINI_API_KEY environment variable in Vercel, then redeploy.';
    } else if (msg.includes('404') || msg.includes('not found')) {
      statusCode = 404;
      errorCode = 'MODEL_NOT_FOUND';
      userMessage = 'The AI model could not be found. Please contact the administrator.';
    }

    return res.status(statusCode).json({
      error: userMessage,
      code: errorCode,
      detail: msg.substring(0, 300)
    });
  }
}
