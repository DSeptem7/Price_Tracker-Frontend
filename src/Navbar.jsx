// src/Navbar.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Recibimos "productCount" como prop opcional, por si queremos mostrarlo en la Home pero no en el detalle
const Navbar = ({ searchTerm, setSearchTerm, isDarkMode, setIsDarkMode, productCount }) => {
  const navigate = useNavigate();
  
  // Estos estados son exclusivos de la Navbar (visuales), así que viven aquí, no en App.jsx
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef(null);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* LOGO: Clickeable para ir al inicio */}
        <span 
          className="logo" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', flexGrow: 0, marginRight: '20px' }}
        >
          🛒 Price Tracker (ML)
        </span>
        
        {/* ESPACIADOR INVISIBLE: Empuja los controles a la derecha */}
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
          {/* BUSCADOR */}
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar..." 
              value={searchTerm}
              onClick={(e) => e.stopPropagation()} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          {/* SWITCH MODO OSCURO */}
          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input 
                type="checkbox" 
                checked={isDarkMode} 
                onChange={() => setIsDarkMode(!isDarkMode)} 
              />
              <div className="slider"></div>
            </label>
          </div>
          
          {/* CONTADOR DE PRODUCTOS (Solo se muestra si se pasa el dato) */}
          {productCount !== undefined && (
             <span className="product-count">
               {productCount} Productos
             </span>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;