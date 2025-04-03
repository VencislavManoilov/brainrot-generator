const express = require("express");
const axios = require("axios");
const app = express();
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const FormData = require("form-data");
const sharp = require("sharp"); // Add sharp for image processing

const PORT = 8080;

// Configure environment variables
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for enabling CORS
app.use(cors({ origin: '*' }));

// Middleware for parsing x-www-form-urlencoded bodies
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({ version: "1.0.0", message: "Welcome to branrot generator api!" })
});

// Image generation endpoint
app.post("/generate", async (req, res) => {
    try {
        const { image1, image2 } = req.body;
        
        if (!image1 || !image2) {
            return res.status(400).json({ error: "Both image1 and image2 are required" });
        }
        
        const allowedImages = [
            "boberito_bondito.png",
            "bombardino_crocodilo.png",
            "bombini_guzini.png",
            "brr_brr_patapim.png",
            "gangster_footera.png",
            "glordo.png",
            "lirili_larilla.png",
            "tralalero_tralala.png",
            "tripi_tropi.png",
            "tung_sahur.png"
        ];

        if (!allowedImages.includes(image1) || !allowedImages.includes(image2)) {
            return res.status(400).json({ error: "Both image1 and image2 must be one of the allowed images" });
        }
        
        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }
        
        // Create form data for multipart/form-data request
        const formData = new FormData();

        // Setup paths for images
        const imagesDir = path.join(__dirname, '/public/images');
        const image1Path = path.join(imagesDir, image1);
        const image2Path = path.join(imagesDir, image2);
        
        // Create images directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Get image buffers for both images
        let image1Buffer;
        let image2Buffer;

        // Get or download image1
        if (!fs.existsSync(image1Path)) {
            const image1Url = `https://images.devman.site/${image1}`;
            const image1Response = await axios.get(image1Url, { responseType: 'arraybuffer' });
            image1Buffer = image1Response.data;
            // Save image for future use
            fs.writeFileSync(image1Path, Buffer.from(image1Buffer));
        } else {
            image1Buffer = fs.readFileSync(image1Path);
        }

        // Get or download image2
        if (!fs.existsSync(image2Path)) {
            const image2Url = `https://images.devman.site/${image2}`;
            const image2Response = await axios.get(image2Url, { responseType: 'arraybuffer' });
            image2Buffer = image2Response.data;
            // Save image for future use
            fs.writeFileSync(image2Path, Buffer.from(image2Buffer));
        } else {
            image2Buffer = fs.readFileSync(image2Path);
        }

        // OpenAI requires specific image formats and dimensions:
        // - Base image must be less than 4MB and be PNG format
        // - Mask image must be same dimensions as base image, with transparent areas showing where to edit
        
        // Process base image (image1) - ensure it's PNG and proper size
        const processedImage1Path = path.join(imagesDir, `processed_${image1}`);
        await sharp(image1Buffer)
            .resize(1024, 1024, { // Match the output size for better results
                fit: 'contain', 
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
            })
            .toFormat('png')
            .toFile(processedImage1Path);
            
        // Process mask image (image2) - needs to have transparent areas to indicate editing regions
        // For a successful edit, we'll create a mask where image2's shape is transparent (to be replaced)
        // and the rest is solid (to be preserved)
        const processedImage2Path = path.join(imagesDir, `processed_${image2}`);
        
        // Create a proper mask for the OpenAI API
        // We need white areas for what we want to keep, and transparent areas for what should be edited
        await sharp(image2Buffer)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .ensureAlpha()
            // Create a white image with transparency where the original image was
            .composite([{
                input: {
                    create: {
                        width: 1024,
                        height: 1024,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    }
                },
                blend: 'dest-in'
            }])
            .negate() // Invert to get transparent where the original image was
            .toFormat('png')
            .toFile(processedImage2Path);
            
        console.log("Sending images to OpenAI API...");
        
        // Use the processed images for the API request
        formData.append('image', fs.createReadStream(processedImage1Path));
        formData.append('mask', fs.createReadStream(processedImage2Path));
        formData.append('prompt', 'Create a hybrid character combining features from both images into a powerful warrior');
        formData.append('n', '1');
        formData.append('size', '1024x1024');
        
        const response = await axios.post(
            "https://api.openai.com/v1/images/edits",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                maxBodyLength: Infinity, // Necessary for larger file uploads
            }
        );
        
        const imageUrl = response.data.data[0].url;
        
        // Clean up processed images after use
        fs.unlinkSync(processedImage1Path);
        fs.unlinkSync(processedImage2Path);
        
        console.log(`Image generated successfully: ${imageUrl}`);

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error("Error generating image:", error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error("OpenAI Error Details:", JSON.stringify(error.response.data.error));
        }
        res.status(500).json({ 
            error: "Failed to generate image", 
            details: error.response?.data || error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});