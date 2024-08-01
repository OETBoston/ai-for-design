const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
require('dotenv').config();
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const {VertexAI} = require('@google-cloud/vertexai');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const { Readable } = require('stream');

const app = express();
const port = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

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

app.post('/generate-images-stability', async (req, res) => {
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
      const imagePath = `./generated_image.jpeg`;
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      console.log(imagePath);
      res.json({ images: '/generated_image.jpeg' });
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

app.post('/edit-image', async (req, res) => {
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
      const editedImagePath = './edited_image.jpeg';
      fs.writeFileSync(editedImagePath, Buffer.from(response.data));
      console.log(editedImagePath);
      res.json({ images: '/edited_image.jpeg' });
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

app.post('/edit-image', async (req, res) => {
  console.log('Request body:', req.body); // Log the entire request body
    
  const { sentence, selectedImage, mask } = req.body;

  const payload = {
    image: fetchImageAsReadStream(selectedImage),
    mask: base64ToReadStream(mask),
    prompt: sentence,
    output_format: "jpeg"
  };
  console.log(payload)
  try {    
    const response = await axios.postForm(
      'https://api.stability.ai/v2beta/stable-image/edit/inpaint',
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'image/*',
        },
      }
    );

    if (response.status === 200) {
      const editedImagePath = './edited_image.jpeg';
      fs.writeFileSync(editedImagePath, Buffer.from(response.data));
      console.log(editedImagePath);
      res.json({ images: '/edited_image.jpeg' });
    } else {
      console.error(`Error editing image: ${response.status}: ${response.data.toString()}`);
      res.status(response.status).json({ error: 'Failed to edit image with Stability API' });
    }
  } catch (error) {
    console.error('Error editing image with Stability API:', error);
    res.status(500).json({ error: 'Failed to edit image with Stability API' });
  }
});



// app.post('/generate-images-imagen', async (req, res) => {
//   const { prompt, sampleCount } = req.body;

//   try {
//     const response = await fetch(`https://${process.env.LOCATION}-aiplatform.googleapis.com/v1/projects/${process.env.PROJECT_ID}/locations/${process.env.LOCATION}/publishers/google/models/${process.env.MODE_VERSION}:predict`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.GCLOUD_ACCESS_TOKEN}`,
//         'Content-Type': 'application/json; charset=utf-8',
//       },
//       body: JSON.stringify({
//         instances: [{ prompt }],
//         parameters: { sampleCount: sampleCount }
//       })
//     });

//     if (response.status === 200) {
//       const result = await response.json();
//       const generatedImages = result.predictions || [];
//       const imageUrls = generatedImages.map((imageData, idx) => {
//         const imgBytes = Buffer.from(imageData.bytesBase64Encoded, 'base64');
//         return `data:${imageData.mimeType};base64,${imgBytes.toString('base64')}`;
//       });
//       res.json({ images: imageUrls });
//     } else {
//       console.error(`Request failed with status code: ${response.status}`);
//       const errorText = await response.text();
//       console.error(errorText);
//       res.status(response.status).json({ error: 'Failed to generate images with Imagen' });
//     }
//   } catch (error) {
//     console.error('Error generating images with Imagen:', error);
//     res.status(500).json({ error: 'Failed to generate images with Imagen' });
//   }
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
