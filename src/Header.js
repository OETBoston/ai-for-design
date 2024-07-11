// Header.js

import React from 'react';

const Header = ({ logoSrc }) => {
  return (
    <header className="bg-blue-500 text-white shadow-md">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logoSrc} alt="Logo" className="h-8 mr-2" /> {/* Placeholder for logo */}
          <h1 className="text-lg font-bold">AI for Design</h1>
        </div>
        {/* Color theme specification UI can be added here */}
      </div>
    </header>
  );
}

export default Header;
