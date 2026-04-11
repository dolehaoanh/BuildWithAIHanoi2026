import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testConnection() {
  if (!API_KEY || API_KEY.includes("YOUR_API_KEY")) {
    console.error("❌ API Key not set correctly in .env");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello!");
    const response = await result.response;
    console.log("✅ Connection Successful! Response:", response.text());
  } catch (error) {
    console.error("❌ Connection Failed:", error.message);
  }
}

testConnection();
