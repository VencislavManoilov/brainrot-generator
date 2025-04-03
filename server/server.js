const express = require("express");
const axios = require("axios");
const app = express();

const PORT = 8080;

// Configure environment variables
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware for parsing JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ version: "1.0.0", message: "Welcome to branrot generator api!" })
});

// Image generation endpoint
app.post("/generate", async (req, res) => {
    try {
        const { hero1, hero2 } = req.body;
        
        if (!hero1 || !hero2) {
            return res.status(400).json({ error: "Please provide both hero names" });
        }
        
        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }
        
        const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                model: "dall-e-3",
                prompt: `Create a single character that is a fusion between ${hero1} and ${hero2}, combining key visual elements and powers from both characters into one cohesive design.`,
                n: 1,
                size: "1024x1024"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                }
            }
        );
        
        const imageUrl = response.data.data[0].url;
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error("Error generating image:", error.response?.data || error.message);
        res.status(500).json({ 
            error: "Failed to generate image", 
            details: error.response?.data || error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});