const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    return res.status(500).json({ error: "BACKEND ERROR: " + error.message });
  }
}
