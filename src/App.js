import React from 'react';
import Header from './Header';
import ImageEditor from './ImageEditor';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Header logoSrc="../assets/logo.png"/>
      <ImageEditor />
    </div>
  );
}

export default App;