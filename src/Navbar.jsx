// src/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate, Link } from 'react-router-dom'; // Importamos Link
import './Navbar.css';

// AHORA RECIBIMOS "products" COMPLETO
const Navbar = ({ products, setSearchTerm, isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  
  // Estado LOCAL del input (lo que el usuario escribe al momento)
  const [localSearch, setLocalSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const searchRef = useRef(null);

  // Cada vez que el usuario escribe, filtramos la lista localmente
  const handleInputChange = (e) => {
    const text = e.target.value;
    setLocalSearch(text);

    if (text.length > 0 && products) {
      // Filtramos productos que coincidan con el texto (ignorando mayúsculas)
      const matches = products.filter(p => 
        p.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(matches);
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Función para "Ver todos los resultados"
  const handleSearchSubmit = () => {
    setSearchTerm(localSearch); // Le avisamos a App.jsx que filtre de verdad
    setIsSearchExpanded(false);
    setFilteredSuggestions([]);
    navigate('/'); // Nos vamos a la home
  };

  // Detectar tecla ENTER
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Lógica para detectar clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Cerramos el desplegable pero NO borramos el texto por si quiere seguir escribiendo luego
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
            setSearchTerm(""); // Limpiar búsqueda global
            setLocalSearch(""); // Limpiar búsqueda local
            navigate('/');
          }} 
          style={{ cursor: 'pointer', flexGrow: 0, marginRight: '20px' }}
        >
          🛒 Price Tracker
        </span>
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
          {/* CONTENEDOR DEL BUSCADOR */}
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar producto..." 
              value={localSearch} // Usamos estado LOCAL
              onClick={() => setIsSearchExpanded(true)} // Al hacer clic, abrimos si hay texto
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            
            <button className="search-btn" onClick={handleSearchSubmit}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* === DESPLEGABLE DE RESULTADOS EN VIVO === */}
            {isSearchExpanded && localSearch.length > 0 && (
              <div className="live-search-results">
                {filteredSuggestions.length > 0 ? (
                  <>
                    {/* Mostramos solo los primeros 5 */}
                    {filteredSuggestions.slice(0, 5).map((p) => (
                      <div 
                        key={p.id} 
                        className="search-result-item"
                        onClick={() => {
                          navigate(`/producto/${p.id}`);
                          setIsSearchExpanded(false);
                          setLocalSearch(""); // Opcional: limpiar al entrar
                        }}
                      >
                        <img src={p.image} alt="" className="mini-thumb" />
                        <div className="mini-info">
                          <span className="mini-title">{p.title}</span>
                          <span className="mini-price">{p.price}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Botón Ver Todos */}
                    <div className="view-all-results" onClick={handleSearchSubmit}>
                      Ver los {filteredSuggestions.length} resultados para "{localSearch}"
                    </div>
                  </>
                ) : (
                  <div className="no-results-item">No se encontraron productos.</div>
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