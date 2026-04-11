import { GoogleGenerativeAI } from "@google/generative-ai";

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
      return res.status(500).json({ error: 'API Key not configured on server. Please check Vercel environment variables.' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();
    
    const cleanHtml = text.replace(/```html|```/g, '');
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ html: cleanHtml });
  } catch (error) {
    console.error("Gemini Backend Error:", error);

    // Classify the error for the frontend
    let statusCode = 500;
    let errorCode = 'UNKNOWN';
    let userMessage = 'An unexpected error occurred. Please try again.';

    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      statusCode = 429;
      errorCode = 'QUOTA_EXCEEDED';
      userMessage = 'API quota has been exceeded. The API key may need to be refreshed or upgraded. Please contact the administrator.';
    } else if (msg.includes('403') || msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED')) {
      statusCode = 403;
      errorCode = 'INVALID_KEY';
      userMessage = 'The API key is invalid or has been revoked. Please generate a new key from Google AI Studio.';
    } else if (msg.includes('404') || msg.includes('not found')) {
      statusCode = 404;
      errorCode = 'MODEL_NOT_FOUND';
      userMessage = 'The AI model could not be found. Please contact the administrator.';
    }

    return res.status(statusCode).json({
      error: userMessage,
      code: errorCode,
      detail: msg
    });
  }
}
