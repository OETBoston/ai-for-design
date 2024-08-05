const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
// using env fron root directory
require('dotenv').config();

const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const {VertexAI} = require('@google-cloud/vertexai');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const { Readable } = require('stream');
const path = require('path');
const app = express();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.use('/api', router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.post('/generate-images', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.images.generate({
      prompt: prompt,
      n: 4,
      size: '256x256',
    });

    const imageUrls = response.data.map(image => image.url);
    res.json({ images: imageUrls });
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});


const clientOptions = {
  apiEndpoint: `${process.env.LOCATION}-aiplatform.googleapis.com`,
};

const predictionServiceClient = new PredictionServiceClient(clientOptions);

app.post('/generate-images-imagen', async (req, res) => {
  const { prompt, sampleCount } = req.body;

  try {
    const [response] = await predictionServiceClient.predict({
      endpoint: `projects/${process.env.PROJECT_ID}/locations/${process.env.LOCATION}/publishers/google/models/${process.env.MODE_VERSION}`,
      instances: [{ prompt }],
      parameters: { sampleCount: sampleCount },
    });

    const generatedImages = response.predictions || [];
    const imageUrls = generatedImages.map((imageData, idx) => {
      const imgBytes = Buffer.from(imageData.bytesBase64Encoded, 'base64');
      return `data:${imageData.mimeType};base64,${imgBytes.toString('base64')}`;
    });
    res.json({ images: imageUrls });
  } catch (error) {
    console.error('Error generating images with Imagen:', error);
    res.status(500).json({ error: 'Failed to generate images with Imagen' });
  }
});

router.post('/generate-images-stability', async (req, res) => {
  const { prompt } = req.body;

  const payload = {
    prompt: prompt,
    output_format: "jpeg",
    // model: "sd3-medium",
    // negative_prompt: "violent objects",
    // mode: "text-to-image"
  };

  try {
    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'image/*',
        },
      }
    );

    if (response.status === 200) {
      const fileName = `generated_image_${Date.now()}.jpeg`;
      const imagePath = path.join(__dirname, '..', 'public', fileName);
      
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      
      console.log(`Image saved to: ${imagePath}`);
      res.json({ imagePath: `/${fileName}` });
    } else {
      console.error(`Error generating image: ${response.status}: ${response.data.toString()}`);
      res.status(response.status).json({ error: 'Failed to generate image with Stability API' });
    }
  } catch (error) {
    console.error('Error generating image with Stability API:', error);
    res.status(500).json({ error: 'Failed to generate image with Stability API' });
  }
});

const dataUrlToBuffer = (dataUrl) => {
  const base64Data = dataUrl.split(',')[1]; // Get the base64 part
  return Buffer.from(base64Data, 'base64'); // Convert to buffer
};

router.post('/edit-image', async (req, res) => {
  console.log('Request body:', req.body);
    
  const { sentence, selectedImage, mask } = req.body;

  try {
    const formData = new FormData();

    // Fetch the image and add it to formData
    const imageStream = await fetchImageAsReadStream(selectedImage);
    formData.append('image', imageStream, { filename: 'image.jpg', contentType: 'image/jpeg' });

    // Convert base64 mask to stream and add it to formData
    const maskStream = base64ToReadStream(mask);
    formData.append('mask', maskStream, { filename: 'mask.png', contentType: 'image/png' });

    // Add other fields
    formData.append('prompt', sentence);
    formData.append('output_format', 'jpeg');

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/edit/inpaint',
      formData,
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'image/*',
        },
      }
    );

    if (response.status === 200) {
      const fileName = `generated_image_${Date.now()}.jpeg`;
      const imagePath = path.join(__dirname, '..', 'public', fileName);
      
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      
      console.log(`Image saved to: ${imagePath}`);
      res.json({ imagePath: `/${fileName}` });
    } else {
      console.error(`Error editing image: ${response.status}: ${response.data.toString()}`);
      res.status(response.status).json({ error: 'Failed to edit image with Stability API' });
    }
  } catch (error) {
    console.error('Error editing image with Stability API:', error);
    res.status(500).json({ error: 'Failed to edit image with Stability API' });
  }
});

// Helper function to fetch image as ReadStream
async function fetchImageAsReadStream(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'stream' });
  return response.data;
}

// Helper function to convert base64 to ReadStream
function base64ToReadStream(base64String) {
  const buffer = Buffer.from(base64String.split(',')[1], 'base64');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});
