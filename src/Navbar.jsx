import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ searchTerm, setSearchTerm, isDarkMode, setIsDarkMode, allProducts = [] }) => {
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Filtrar productos para el buscador en vivo
  const liveResults = searchTerm.length > 1 
    ? allProducts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6) 
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        if (searchTerm === "") setIsSearchExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchTerm]);

  const handleSelectProduct = (id) => {
    setShowResults(false);
    setSearchTerm(""); // Limpiamos para la próxima búsqueda
    navigate(`/producto/${id}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <span className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          🛒 Price Tracker
        </span>
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onFocus={() => setShowResults(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
                setIsSearchExpanded(true);
              }}
            />
            <button className="search-btn" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* PANEL DE RESULTADOS EN VIVO */}
            {showResults && liveResults.length > 0 && (
              <div className="live-search-results">
                {liveResults.map((product) => (
                  <div 
                    key={product.id} 
                    className="live-result-item"
                    onClick={() => handleSelectProduct(product.id)}
                  >
                    <img src={product.image} alt={product.title} className="live-result-img" />
                    <div className="live-result-info">
                      <span className="live-result-title">{product.title}</span>
                      <span className="live-result-price">${Number(product.current_price).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
              <div className="slider"></div>
            </label>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

