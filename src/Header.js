// Header.js
import React from 'react';

const Header = ({ logoSrc }) => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          {/* <img src={logoSrc} alt="Logo" className="h-8 mr-2" /> */}
          <h1 className="text-2xl font-bold hover:text-blue-300 transition duration-300">AI for Design</h1>
        </div>
        <nav className="flex space-x-4">
          <a href="#about" className="hover:text-blue-300 transition duration-300">About</a>
          <a href="#services" className="hover:text-blue-300 transition duration-300">Services</a>
          <a href="#contact" className="hover:text-blue-300 transition duration-300">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;