const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
