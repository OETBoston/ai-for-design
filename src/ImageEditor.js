import React, { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);   
  const canvasRef = useRef(null);

  const handleImageClick = (image) => {
      setSelectedImage(image);
      setPoints([]);
  };

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

  // const handleGenerateImages = async () => {
  //   setLoading(true);
  //   const prompt = sentence;
  //   try {
  //     const response = await fetch('http://localhost:5000/generate-images', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ prompt, sampleCount: 4}),
  //     });

  //     const data = await response.json();
  //     const images = Array.isArray(data.images) ? data.images : [];
  //     setGeneratedImages(images);
  //   } catch (error) {
  //     console.error('Error generating images:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const useStability = true;
  const handleGenerateImages = async () => {
    // const imageUrls = ["/generated_image.jpeg"];
    // setGeneratedImages(imageUrls);
    setLoading(true);
    const prompt = sentence;
    try {
      const response = await fetch('http://localhost:5000/generate-images-stability', {
      // const response = await fetch('http://localhost:5000/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data); // Debugging log

        // Create a URL for the image
        const imageUrl = `http://localhost:5000${data.images}`;
        setGeneratedImages([imageUrl]);
      } else {
        console.error(`Request failed with status code: ${response.status}`);
        const errorText = await response.text();
        console.error(errorText);
      }
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasDraw = (e) => {
    if (!drawing) return;
  
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Adjust coordinates based on canvas size and display size
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
  
    setPoints((prevPoints) => {
      const newPoints = [...prevPoints, { x, y }];
      if (newPoints.length > 1) {
        const lastPoint = newPoints[newPoints.length - 2];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      return newPoints;
    });
  };
  
  const handleMouseDown = () => {
    setDrawing(true);
  };
  
  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleFinalizeDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
  
    if (points.length > 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.stroke();
    }
    setPoints([]);
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
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Images'}
      </button>
      <button
        onClick={handleFinalizeDrawing}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Finalize Drawing
      </button>
      <div className="flex justify-center gap-6">
          {generatedImages.length === 0 && <p>No images generated.</p>}
          {generatedImages.map((image, index) => (
            <div
              key={index}
              className={`bg-gray-300 rounded-lg flex items-center justify-center h-64 w-64 overflow-hidden relative ${selectedImage === image ? 'border-4 border-blue-500' : ''}`}
              onClick={() => handleImageClick(image)}
            >
              <img src={image} alt={`Generated Image ${index + 1}`} className="object-cover w-full h-full" />
              {selectedImage === image && (
                  <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseMove={handleCanvasDraw}
                  />
              )}
            </div>
          ))}
      </div>
    </div>
  );  
}

export default ImageEditor;