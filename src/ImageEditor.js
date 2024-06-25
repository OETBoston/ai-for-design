import React, { useState } from 'react';
import Dropdown from './Dropdown';

const options = {
  word1: ['simple wood flooring', 'tile flooring', 'carpet'],
  word2: ['faint light', 'bright light', 'dim light'],
  word3: ['warm yellow tones', 'cool blue tones', 'neutral tones'],
};

// arbitrarily defined function for picking keywords
const chooseKeywords = (sentence) => {
    const words = sentence.split(' ');
    return {
      word1: words[0] || '',
      word2: words[1] || '',
      word3: words[2] || '',
    };
  };

function ImageEditor() {
  const [sentence, setSentence] = useState('');
  const [words, setWords] = useState(chooseKeywords(sentence));
  const [generatedImages, setGeneratedImages] = useState([]); 

  const handleChangeWord = (name, value) => {
    setWords({ ...words, [name]: value });
  };

  const handleGenerateImages = () => {
    // Replace with actual image generation logic
    const newImages = ['test.png', 'test.png', 'test.png', 'test.png'];
    setGeneratedImages(newImages);
  };

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
              {index === 0 && options.word1 && <Dropdown name="word1" options={options.word1} value={words.word1} onChange={handleChangeWord} />}
              {index === 1 && options.word2 && <Dropdown name="word2" options={options.word2} value={words.word2} onChange={handleChangeWord} />}
              {index === 2 && options.word3 && <Dropdown name="word3" options={options.word3} value={words.word3} onChange={handleChangeWord} />}
              {index !== 0 && index !== 1 && index !== 2 && ` ${word}`}
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
