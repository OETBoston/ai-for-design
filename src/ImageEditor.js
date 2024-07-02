import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';

const defaultOptions = {
  word1: ['simple wood flooring', 'tile flooring', 'carpet'],
  word2: ['faint light', 'bright light', 'dim light'],
  word3: ['warm yellow tones', 'cool blue tones', 'neutral tones'],
};

const chooseKeywords = (sentence) => {
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'];
  
  const words = sentence.toLowerCase().match(/\b(\w+)\b/g) || [];
  
  const potentialKeywords = words
      .filter(word => !stopWords.includes(word))
      .sort((a, b) => b.length - a.length);
  
  return {
      word1: potentialKeywords[0] || '',
      word2: potentialKeywords[1] || '',
      word3: potentialKeywords[2] || '',
  };
};

function ImageEditor() {
  const [sentence, setSentence] = useState('');
  const [keywords, setKeywords] = useState({ word1: '', word2: '', word3: '' });
  const [options, setOptions] = useState(defaultOptions);
  const [generatedImages, setGeneratedImages] = useState([]); 

  useEffect(() => {
    const newKeywords = chooseKeywords(sentence);
    setKeywords(newKeywords);
    
    // Update options to include the original words
    setOptions({
      word1: [newKeywords.word1, ...defaultOptions.word1].filter((v, i, a) => a.indexOf(v) === i),
      word2: [newKeywords.word2, ...defaultOptions.word2].filter((v, i, a) => a.indexOf(v) === i),
      word3: [newKeywords.word3, ...defaultOptions.word3].filter((v, i, a) => a.indexOf(v) === i),
    });
  }, [sentence]);

  const handleChangeWord = (name, value) => {
    setKeywords(prev => ({ ...prev, [name]: value }));
    
    // Update the sentence when a dropdown word changes
    const words = sentence.split(' ');
    if (name === 'word1' && words.length > 0) words[0] = value;
    if (name === 'word2' && words.length > 1) words[1] = value;
    if (name === 'word3' && words.length > 2) words[2] = value;
    setSentence(words.join(' '));
  };

  // const axios = require('axios');

  const handleGenerateImages = () => {
    // Replace with actual image generation logic
    const newImages = ['test.png', 'test.png', 'test.png', 'test.png'];
    setGeneratedImages(newImages);
  };
  // const handleGenerateImages = async () => {
  //   const apiKey = 'YOUR_CLOUD_VISION_API_KEY'; // Replace with your actual API key
  
  //   const prompt = `${words.word1} ${words.word2} ${words.word3}`;
  
  //   try {
  //     const response = await axios.post(
  //       'https://vision.googleapis.com/v1/images:annotate',
  //       {
  //         requests: [
  //           {
  //             image: {
  //               content: btoa(prompt), // Base64-encode the prompt for the request
  //             },
  //             features: [
  //               {
  //                 type: 'IMAGE_GENERATION', // Specify image generation feature
  //                 max_num_images: 4, // Request up to 4 generated images
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${apiKey}`,
  //         },
  //       }
  //     );
  
  //     const generatedImageUrls = response.data.responses[0].generateImageAnnotation.images.map(
  //       (image) => image.uri
  //     );
  //     setGeneratedImages(generatedImageUrls);
  //   } catch (error) {
  //     console.error('Error generating images:', error);
  //   }
  // };
  

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <input
          type="text"
          className="border rounded p-2 w-full mb-4"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
        />
        <p>
          {sentence.split(' ').map((word, index) => (
            <span key={index}>
              {index === 0 && <Dropdown name="word1" options={options.word1} value={keywords.word1} onChange={handleChangeWord} />}
              {index === 1 && <Dropdown name="word2" options={options.word2} value={keywords.word2} onChange={handleChangeWord} />}
              {index === 2 && <Dropdown name="word3" options={options.word3} value={keywords.word3} onChange={handleChangeWord} />}{index > 2 && ` ${word}`}
              {index < sentence.split(' ').length - 1 && ' '}
            </span>
          ))}
        </p>
      </div>
      <button
        onClick={handleGenerateImages}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Generate Images
      </button>
      <div className="grid grid-cols-2 gap-4">
        {generatedImages.map((image, index) => (
          <div key={index} className="bg-gray-300 rounded h-40 flex items-center justify-center">
            <img src={image} alt={`Generated Image ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );  
}

export default ImageEditor;
