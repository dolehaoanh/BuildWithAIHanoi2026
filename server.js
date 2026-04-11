import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/generate.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files (index.html, etc.)
app.use(express.static(__dirname));

// Map the API route to your handler
app.post('/api/generate', handler);

app.listen(PORT, () => {
    console.log(`🚀 Kinetic Lab is live at http://localhost:${PORT}`);
    console.log(`Using API Key: ${process.env.GEMINI_API_KEY.substring(0, 4)}...`);
});
