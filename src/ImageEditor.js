import React, { useState, useEffect, useRef } from 'react';
import config from './config';
// import SidePanel from './SidePanel';

function ImageEditor() {
  const [sentence, setSentence] = useState('');
  const [pastPrompts, setPastPrompts] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(true);


  const [selectedImage, setSelectedImage] = useState(null);
  const [referenceImg, setReferenceImage] = useState(null);
  const [isReferenceImageSet, setIsReferenceImageSet] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);   
  const canvasRef = useRef(null);
  const [imageMask, setImageMask] = useState(null);

  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result;
              setUploadedImages([base64String]);
              // console.log(uploadedImages); 
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleReferenceImageAction = () => {
    if (!isReferenceImageSet) {
      setReferenceImage(uploadedImages[0]);
      setIsReferenceImageSet(true);
    } else {
      setReferenceImage(null);
      setUploadedImages([]);
      setIsReferenceImageSet(false);
    }
    console.log(referenceImg);
  };
  
  const handleImageClick = (image) => {
      setSelectedImage(image);
      // setPoints([]);
  };

  const addPromptToHistory = (newPrompt, generatedImages) => {
    setPastPrompts(prevPrompts => {
      // // Add the new prompt and image(s) to the history
      const newHistory = [{ prompt: newPrompt, images: generatedImages }, ...prevPrompts];

      // Save the new prompt history to localStorage
      localStorage.setItem('promptHistory', JSON.stringify(newHistory));

      return newHistory;
    });
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

  const handleImageOperation = async (imageMask = null) => {
    setLoading(true);

    const prompt = sentence;
  
    try {
      let endpoint, payload;
      const formData = new FormData();
      formData.append('sentence', prompt);

      if (imageMask && typeof imageMask === 'string') {
        console.log("editing image")
        // Image editing
        endpoint = `${config.apiUrl}/edit-image`;
        formData.append('selectedImage', selectedImage); 
        formData.append('mask', imageMask);
        payload = { sentence: prompt, selectedImage, mask: imageMask };
      } else {
        // Image generation
        endpoint = `${config.apiUrl}/generate-images-stability`;
        payload = { sentence: prompt };
        if (isReferenceImageSet) {
          payload.refImg = referenceImg;
        }
      }
      console.log(payload)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Response data:', data.imagePaths);

        // Check if imagePaths is an array or a single image
        const imagePaths = data.imagePaths;
        const imageUrls = Array.isArray(imagePaths) 
            ? imagePaths.map(path => `${config.imgUrl}${path}`) 
            : [];

        if (Array.isArray(imagePaths)) {
            // If it's an array, update the generated images with all new images
            setGeneratedImages(imageUrls);
            addPromptToHistory(sentence, imageUrls);
        } else {
            // If it's a single image, update the selected image and replace it in the array
            const newImageUrl = imagePaths ? `${config.imgUrl}${imagePaths}` : '';
            addPromptToHistory(sentence, [newImageUrl]);
            setGeneratedImages([newImageUrl])
        }

  
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

  useEffect(() => {
    // Load the prompt history from localStorage
    const storedHistory = localStorage.getItem('promptHistory');
    if (storedHistory) {
      setPastPrompts(JSON.parse(storedHistory));
    }
  }, []);

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
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4">
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700">Prompt Engineering Guidelines</h3>
          <p className="mt-2 text-sm text-gray-600">
            Use clear, concise language. Specify details and constraints to guide the generation process. Experiment with different phrasings to get the best results.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <input
            type="text"
            className="border rounded-lg p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
        </div>
  
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleImageOperation(imageMask)}
            className="flex items-center justify-center min-w-[150px] h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center justify-center min-w-[150px] h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Finalize Drawing
          </button>
          <button
            onClick={handleReferenceImageAction}
            className={`flex items-center justify-center min-w-[150px] h-12 ${isReferenceImageSet ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
          >
            {isReferenceImageSet ? 'Clear Reference' : 'Use Reference'}
          </button>
        </div>
        
        <div className="flex space-x-4">
          <div className="w-1/4 bg-gray-200 p-4 rounded-lg">
            <div className="mb-4">
              <div className="relative cursor-pointer">
                <img src="/upload-icon.png" alt="Upload Icon" className="upload-icon" onClick={() => document.getElementById('upload-input').click()} />
                <input
                  type="file"
                  id="upload-input"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {uploadedImages.map((image, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-lg flex items-center justify-center h-32 w-32 overflow-hidden relative"
                  onClick={() => handleImageClick(image)}
                >
                  <img src={image} alt={`Uploaded Image ${index + 1}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </div>


          <div className="flex flex-wrap gap-6 mt-4">
            {generatedImages.length === 0 && <p>No images generated.</p>}
            {generatedImages.map((image, index) => (
              <div
                key={index}
                className={`bg-gray-300 rounded-lg flex items-center justify-center h-64 w-64 overflow-hidden relative border-2 ${selectedImage === image ? 'border-blue-500' : 'border-transparent'} transition-all duration-300`}
                onClick={() => handleImageClick(image)}
              >
                <img src={image} alt={`Generated Image ${index + 1}`} className="object-cover w-full h-full" />
                
                {selectedImage === image && (
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full canvas-overlay"
                    onMouseDown={() => handleMouseDown()}
                    onMouseUp={() => handleMouseUp()}
                    onMouseMove={(e) => handleCanvasDraw(e)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
  
      {/* SidePanel */}
      <div
        className={`fixed top-0 right-0 h-full max-w-xs bg-white border-l border-gray-200 shadow-lg p-4 transition-transform duration-300 ease-in-out ${sidePanelCollapsed ? 'translate-x-full' : 'translate-x-0'}`}
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${sidePanelCollapsed ? 'text-transparent' : 'text-blue-600'}`}>
            Past Prompts
          </h2>
          <button
            onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)}
            className="text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {sidePanelCollapsed ? (
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
        {!sidePanelCollapsed && (
          <>
            <ul className="space-y-2">
              {pastPrompts.map((item, index) => (
                <li
                  key={index}
                  className="cursor-pointer p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setSentence(item.prompt)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span>{item.prompt}</span>
                    </div>
                    {item.images && item.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {item.images.map((image, imageIndex) => (
                          <img
                            key={`${index}-${imageIndex}`}
                            src={image}
                            alt={`Generated image ${imageIndex}`}
                            className="w-full h-auto object-cover rounded-md"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

      </div>

      {/* Re-expand Button */}
      {sidePanelCollapsed && (
        <button
          onClick={() => setSidePanelCollapsed(false)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 focus:outline-none z-20"
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ImageEditor;