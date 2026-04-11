import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * GET /api/health
 * Quick diagnostics endpoint — tests the API key with a minimal prompt.
 * Returns model status without exposing the full key.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      status: 'error',
      code: 'NO_API_KEY',
      message: 'GEMINI_API_KEY environment variable is not set in Vercel.',
      keyPrefix: null,
    });
  }

  const keyPrefix = API_KEY.substring(0, 8) + '...';
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  const results = [];

  const genAI = new GoogleGenerativeAI(API_KEY);

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Reply with exactly: OK");
      const text = result.response.text().trim();
      results.push({ model: modelName, status: 'ok', response: text });
    } catch (err) {
      const msg = err.message || '';
      let code = 'ERROR';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) code = 'QUOTA_EXCEEDED';
      else if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API key not valid')) code = 'INVALID_KEY';
      results.push({ model: modelName, status: 'error', code, detail: msg.substring(0, 200) });
    }
  }

  const anyOk = results.some(r => r.status === 'ok');
  return res.status(anyOk ? 200 : 503).json({
    status: anyOk ? 'healthy' : 'degraded',
    keyPrefix,
    models: results,
    timestamp: new Date().toISOString(),
  });
}
