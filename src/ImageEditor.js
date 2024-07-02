import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';

const defaultOptions = {
  word1: ['simple', 'tile', 'carpet'],
  word2: ['faint', 'bright', 'dim'],
  word3: ['warm', 'cool', 'neutral'],
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
    
    setOptions({
      word1: [newKeywords.word1, ...defaultOptions.word1].filter((v, i, a) => a.indexOf(v) === i),
      word2: [newKeywords.word2, ...defaultOptions.word2].filter((v, i, a) => a.indexOf(v) === i),
      word3: [newKeywords.word3, ...defaultOptions.word3].filter((v, i, a) => a.indexOf(v) === i),
    });
  }, [sentence]);                         

  const handleChangeWord = (name, value) => {
    setKeywords(prev => ({ ...prev, [name]: value }));
    
    const words = sentence.split(/\s+/);
    const index = words.findIndex(word => word === keywords[name]);
    if (index !== -1) {
      words[index] = value;
      setSentence(words.join(' '));
    }
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
        {sentence.split(/\s+/).map((word, index) => (
          <span key={index}>
            {word === keywords.word1 && <Dropdown name="word1" options={options.word1} value={keywords.word1} onChange={handleChangeWord} />}
            {word === keywords.word2 && <Dropdown name="word2" options={options.word2} value={keywords.word2} onChange={handleChangeWord} />}
            {word === keywords.word3 && <Dropdown name="word3" options={options.word3} value={keywords.word3} onChange={handleChangeWord} />}
            {![keywords.word1, keywords.word2, keywords.word3].includes(word) && word}
            {' '}
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
