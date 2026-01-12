import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ products, setSearchTerm, isDarkMode, setIsDarkMode }) => {
  console.log("DATOS EN NAVBAR:", products);
  const navigate = useNavigate();
  
  const [localSearch, setLocalSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null); // Referencia para el input

  // Lógica de filtrado en vivo
  const handleInputChange = (e) => {
    const text = e.target.value;
    setLocalSearch(text);

    if (text.length > 0 && products) {
      const matches = products.filter(p => 
        p.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(matches);
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Función FINAL: Ejecuta la búsqueda global y cambia de página
  const handleSearchSubmit = () => {
    if (localSearch.trim() === "") return; // No buscar si está vacío
    
    setSearchTerm(localSearch); 
    setIsSearchExpanded(false);
    setFilteredSuggestions([]);
    navigate('/'); 
  };

  // --- CORRECCIÓN CLAVE: Lógica inteligente del botón de lupa ---
  const handleSearchIconClick = (e) => {
    e.stopPropagation(); // Evita que el click cierre el buscador inmediatamente

    if (!isSearchExpanded) {
      // 1. Si está CERRADO -> ABRIRLO
      setIsSearchExpanded(true);
      // Ponemos el foco en el input automáticamente
      setTimeout(() => inputRef.current?.focus(), 100); 
    } else {
      // 2. Si está ABIERTO...
      if (localSearch.trim() !== "") {
        // ...y hay texto -> BUSCAR
        handleSearchSubmit();
      } else {
        // ...y está vacío -> CERRARLO
        setIsSearchExpanded(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Clic fuera para cerrar
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <span 
          className="logo" 
          onClick={() => {
            setSearchTerm(""); 
            setLocalSearch(""); 
            navigate('/');
          }} 
          style={{ cursor: 'pointer', flexGrow: 0, marginRight: '20px' }}
        >
          🛒 Price Tracker
        </span>
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            <input 
              ref={inputRef} // Conectamos la referencia
              type="text" 
              className="search-input" 
              placeholder="Buscar..." 
              value={localSearch}
              onClick={() => setIsSearchExpanded(true)}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            
            {/* CORRECCIÓN: Usamos la nueva función handleSearchIconClick */}
            <button className="search-btn" onClick={handleSearchIconClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Dropdown de resultados (Live Search) */}
            {isSearchExpanded && localSearch.length > 0 && (
              <div className="live-search-results">
                {filteredSuggestions.length > 0 ? (
                  <>
                    {filteredSuggestions.slice(0, 5).map((p) => (
                      <div 
                        key={p.id} 
                        className="search-result-item"
                        onClick={() => {
                          navigate(`/producto/${p.id}`);
                          setIsSearchExpanded(false);
                          setLocalSearch(""); 
                        }}
                      >
                        <img src={p.image} alt="" className="mini-thumb" />
                        <div className="mini-info">
                          <span className="mini-title">{p.title}</span>
                          <span className="mini-price">{p.price}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="view-all-results" onClick={handleSearchSubmit}>
                      Ver resultados para "{localSearch}"
                    </div>
                  </>
                ) : (
                  <div className="no-results-item">Sin resultados</div>
                )}
              </div>
            )}
          </div>

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

        </div>
      </div>
    </nav>
  );
};

export default Navbar;