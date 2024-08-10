import React, { useState, useEffect, useRef } from 'react';
import Dropdown from './Dropdown';
import config from './config';
import SidePanel from './SidePanel';


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
  const [pastPrompts, setPastPrompts] = useState([]);
  const [keywords, setKeywords] = useState({ word1: '', word2: '', word3: '' });
  const [options, setOptions] = useState(defaultOptions);
  const [generatedImages, setGeneratedImages] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);   
  const canvasRef = useRef(null);
  const [imageMask, setImageMask] = useState(null);

  const handleImageClick = (image) => {
      setSelectedImage(image);
      // setPoints([]);
  };

  // Function to handle adding a new prompt to history
  const addPromptToHistory = (newPrompt) => {
    setPastPrompts(prevPrompts => {
      // Check if the newPrompt already exists to avoid duplicates
      if (prevPrompts.includes(newPrompt)) {
        return prevPrompts;
      }
      // Add the new prompt to the history
      return [newPrompt, ...prevPrompts];
    });
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

  const handleGenerateImagesDALLE = async () => {
    setLoading(true);
    const prompt = sentence;
    try {
      const response = await fetch('http://localhost:5000/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, sampleCount: 4}),
      });

      const data = await response.json();
      const images = Array.isArray(data.images) ? data.images : [];
      setGeneratedImages(images);
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
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
      // console.log('New points:', newPoints); // Log the new points array
      
      if (newPoints.length > 1) {
        const lastPoint = newPoints[newPoints.length - 2];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      console.log("current points", points)
      return newPoints;
    });
  };
  
  const handleMouseDown = () => {
    setDrawing(true);
  };
  
  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleImageEditing = async (imageMask) => {
    console.log(imageMask)
    if (typeof imageMask !== 'string') {
      console.error('Invalid image mask:', imageMask);
      return; // Exit if imageMask is not valid
    }
    try {
      const response = await fetch('http://localhost:5000/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence, selectedImage, mask: imageMask }),
      });
      console.log(response)
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data); // Debugging log

        // Create a URL for the image
        const imageUrl = `http://localhost:5000${data.images}`;
        console.log('Setting generated images:', [imageUrl]);
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

  const handleImageOperation = async (imageMask = null) => {
    setLoading(true);

    // Add the new prompt to the history
    addPromptToHistory(sentence);

    const prompt = sentence;
  
    try {
      let endpoint, payload;
      console.log('imageMask:', imageMask, 'Type:', typeof imageMask);
      if (imageMask && typeof imageMask === 'string') {
        console.log("editing image")
        // Image editing
        endpoint = `${config.apiUrl}/edit-image`;
        // endpoint = `${apiUrl}/edit-image`;
        payload = { sentence: prompt, selectedImage, mask: imageMask };
      } else {
        // Image generation
        endpoint = `${config.apiUrl}/generate-images-stability`;
        payload = { prompt };
      }
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data.imagePaths);
      
        // Ensure data.imagePaths is a valid array of URLs
        const imageUrls = Array.isArray(data.imagePaths) ? 
          data.imagePaths.map(path => `${config.imgUrl}${path}`) : [];
        console.log('Generated image URLs:', imageUrls);
        
        // Update the state with the array of image URLs
        setGeneratedImages(imageUrls);
  
        if (imageMask) {
          // Reset mask-related states
          setImageMask(null);
          setPoints([]);
        }
      } else {
        console.error(`Request failed with status code: ${response.status}`);
        const errorText = await response.text();
        console.error(errorText);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      console.log('Updated points:', points); // This will log the points whenever they change
  }, [points]);

  const handleFinalizeDrawing = () => {
    const canvas = canvasRef.current;
    console.log('In function')
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
  
    console.log('Finalizing drawing with points:', points);
  
    // Create a temporary canvas for the binary mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
  
    // Draw the path on the temporary canvas
    tempCtx.fillStyle = 'black';
    tempCtx.strokeStyle = 'black';
    tempCtx.lineWidth = 2;
    tempCtx.beginPath();
    if (points.length > 2) {
      tempCtx.moveTo(points[0].x, points[0].y);
      points.forEach(point => tempCtx.lineTo(point.x, point.y));
    }
    tempCtx.closePath();
    tempCtx.fill();
    tempCtx.stroke();
  
    // Flood fill the enclosed regions
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
  
    // Simple flood fill algorithm
    const stack = [];
    const visited = new Set();
  
    const floodFill = (x, y) => {
      const key = `${x},${y}`;
      if (visited.has(key)) return;
      visited.add(key);
  
      const index = (y * tempCanvas.width + x) * 4;
      if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0 && data[index + 3] === 255) {
        data[index] = data[index + 1] = data[index + 2] = 255;
        stack.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
      }
    };
  
    // Start flood fill from the center
    stack.push([Math.floor(tempCanvas.width / 2), Math.floor(tempCanvas.height / 2)]);
  
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x >= 0 && x < tempCanvas.width && y >= 0 && y < tempCanvas.height) {
        floodFill(x, y);
      }
    }
  
    // Put the modified image data back on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
  
    // Convert to binary (black and white only)
    const binaryImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const binaryData = binaryImageData.data;
    for (let i = 0; i < binaryData.length; i += 4) {
      const avg = (binaryData[i] + binaryData[i + 1] + binaryData[i + 2]) / 3;
      const color = avg > 127 ? 255 : 0;
      binaryData[i] = binaryData[i + 1] = binaryData[i + 2] = color;
    }
    tempCtx.putImageData(binaryImageData, 0, 0);
  
    // Save the binary mask as an image
    const imageMask = tempCanvas.toDataURL('image/png');
    console.log('Binary mask data URL:', imageMask);
  
    setImageMask(imageMask);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  };
  

  return (
    <div className="app-container flex">
      <div className="flex-1">
        <div className="bg-white p-4 rounded shadow mb-4">
          <input
            type="text"
            className="border rounded p-2 w-full mb-4"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleImageOperation(imageMask)}
            className={`flex items-center justify-center min-w-[150px] h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Images'
            )}
          </button>

          <button
            onClick={handleFinalizeDrawing}
            className="flex items-center justify-center min-w-[150px] h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Finalize Drawing
          </button>
        </div>

        <div className="flex flex-wrap gap-6">
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
                  onMouseDown={() => handleMouseDown()}
                  onMouseUp={() => handleMouseUp()}
                  onMouseMove={(e) => handleCanvasDraw(e)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <SidePanel pastPrompts={pastPrompts} setSentence={setSentence} />
    </div>
  );

}

export default ImageEditor;