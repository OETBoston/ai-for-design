const express = require('express');
const cors = require('cors');
// using env from root directory
require('dotenv').config();

const bodyParser = require('body-parser');

const fs = require('fs'); // For callback-based and synchronous methods
const fsPromises = require('fs').promises; // For promise-based methods

const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const { Readable } = require('stream');
const path = require('path');
const app = express();
const router = express.Router();

app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.use('/api', router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Download image function
router.get('/download-image', (req, res) => {
  const { fileName } = req.query; // Expecting the file name in query parameters

  if (!fileName) {
    return res.status(400).json({ error: 'File name is required' });
  }

  const imagePath = path.join(__dirname, '..', 'public', fileName);

  // Check if the file exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${fileName}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Send the file as an attachment for download
    res.download(imagePath, (err) => {
      if (err) {
        console.error(`Error downloading file: ${fileName}`, err);
        return res.status(500).json({ error: 'Failed to download the file' });
      }
    });
  });
});

function base64ToBuffer(base64) {
  // Remove the data URL prefix if it exists
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, 'base64');
}

router.post('/generate-images-stability', async (req, res) => {
  const { sentence, numImages = 2, refImg=null } = req.body;
  console.log(sentence);
  console.log(req.body)
  let payload = {
    prompt: sentence,
    output_format: "jpeg",
    mode: "text-to-image"
  };
  if (refImg != null) {
    console.log("using ref");
    const imageBuffer = base64ToBuffer(refImg);
    payload.image = imageBuffer;
    payload.mode = "image-to-image";
    payload.strength = 0.25;
  }
  console.log(payload)
  // Function to generate an image
  const generateImage = async () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'image') {
        formData.append(key, value, {
          filename: 'image.jpg',
          contentType: value.type,
        });
      } else {
        formData.append(key, value);
      }
    }
  
    return await axios.post(
      `https://api.stability.ai/v2beta/stable-image/generate/sd3`,
      formData,
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'image/*',
        },
      }
    );
  };
  
  
  try {
    // Generate the specified number of images
    const results = await Promise.allSettled(Array.from({ length: numImages }, generateImage));

    const imagePaths = await Promise.all(results.map(async (result, index) => {
      if (result.status === 'fulfilled' && result.value.status === 200) {
        const fileName = `generated_image_${index + 1}_${Date.now()}.jpeg`;
        const imagePath = path.join(__dirname, '..', 'public', fileName);
        await fsPromises.writeFile(imagePath, Buffer.from(result.value.data));
        return `/${fileName}`;
      } else {
        console.error(`Error generating image ${index + 1}:`, result.reason || result.value.data.toString());
        if (result.status === 'rejected') {
            console.error(`Error generating image ${index + 1}:`, result.reason?.errors || result.reason);
        } else {
            console.error(`Error generating image ${index + 1}: Status code ${result.value.status}`);
        }
        return null;
      }
    }));

    res.json({ imagePaths: imagePaths });
  } catch (error) {
    console.error('Error generating images with Stability API:', error);
    res.status(500).json({ error: 'Failed to generate images with Stability API' });
  }
});

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
      res.json({ imagePaths: `/${fileName}` });
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
