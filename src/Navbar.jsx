import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

// NOTA: Ya no necesitamos recibir 'products' aquí porque la búsqueda es en el servidor
const Navbar = ({ isDarkMode, setIsDarkMode, productCount }) => {
  const API_BASE = "https://price-tracker-nov-2025.onrender.com";
  const { user, loginWithGoogle, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [localSearch, setLocalSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null); 

  // --- AUTOCOMPLETE ---
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);

  // --- NUEVA LÓGICA SIMPLIFICADA ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
  
    // limpiar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  
    // evitar llamadas innecesarias
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
  
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
  
        const res = await fetch(
          `${API_BASE}/autocomplete?q=${encodeURIComponent(value)}`
        );
  
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : data.suggestions || []);
  
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 🔥 debounce 300ms
  };
  
  // Ejecuta la búsqueda y manda a la URL
  const handleSearchSubmit = () => {
    if (localSearch.trim() === "") return; 
    
    setIsSearchExpanded(false);
    
    // Navegamos con el parámetro 'q' para que App.jsx capture el cambio y llame a la API
    navigate(`/?q=${encodeURIComponent(localSearch)}`);
    
    setLocalSearch(""); 
  };

  const handleSearchIconClick = (e) => {
    e.stopPropagation(); 

    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100); 
    } else {
      if (localSearch.trim() !== "") {
        handleSearchSubmit();
      } else {
        setIsSearchExpanded(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
  
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
  
    const parts = text.split(regex);
  
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Clic fuera para cerrar
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <span 
          className="logo" 
          onClick={() => {
            setLocalSearch(""); 
            navigate('/');
          }} 
          style={{ cursor: 'pointer', flexGrow: 0, marginRight: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          🛒 Price Tracker
        </span>
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            {/* NUEVO: Botón de regreso (solo visible cuando está expandido) */}
            {isSearchExpanded && (
              <button 
                className="back-search-btn" 
                onClick={() => setIsSearchExpanded(false)}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            
            <input 
              ref={inputRef} 
              type="text" 
              className="search-input" 
              placeholder="Buscar productos..." 
              value={localSearch}
              onClick={() => setIsSearchExpanded(true)}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            
            {isSearchExpanded && localSearch && (
              <button 
                className="clear-search-x" 
                onClick={() => {
                  setLocalSearch("");
                  inputRef.current?.focus(); 
                }}
                type="button"
              >
                ✕
              </button>
            )}

            <button className="search-btn" onClick={handleSearchIconClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* --- DROPDOWN INFORMATIVO --- */}
            {isSearchExpanded && localSearch.length > 0 && (
              <div className="live-search-results">

                {/* LOADING */}
                {isLoadingSuggestions && (
                  <div className="search-result-item">
                    
                    <div className="search-icon spinner">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 50 50"
                      >
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="mini-info">
                      <span className="mini-title">Buscando en el servidor...</span>
                    </div>

                  </div>
                )}

                {/* SUGERENCIAS (limitadas a 5) */}
                {!isLoadingSuggestions && suggestions.length > 0 && (
                  <>
                    {suggestions.slice(0, 5).map((s, i) => (
                      <div
                        key={i}
                        className="search-result-item"
                        onClick={() => {
                          navigate(`/?q=${encodeURIComponent(s.title)}`);
                          setIsSearchExpanded(false);
                          setLocalSearch("");
                        }}
                      >
                        {/* 🔍 ICONO */}
                        <div className="search-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </div>

                        {/* TEXTO */}
                        <span className="mini-title">
                          {highlightMatch(s.title, localSearch)}
                        </span>
                      </div>
                    ))}

                    {/* 🔥 BOTÓN VER MÁS */}
                    <div
                      className="view-all-results"
                      onClick={() => {
                        navigate(`/?q=${encodeURIComponent(localSearch)}`);
                        setIsSearchExpanded(false);
                        setLocalSearch("");
                      }}
                    >
                      Ver todos los resultados para "{localSearch}"
                    </div>
                  </>
                )}

                {/* SIN RESULTADOS */}
                {!isLoadingSuggestions && suggestions.length === 0 && (
                  <div className="no-results-live">
                    
                    <div className="no-results-icon-mini">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                    </div>

                    <p>No encontramos coincidencias</p>
                    <span className="search-tip">
                      Intenta escribir otra cosa o presiona Enter
                    </span>

                    <div
                      className="view-all-results"
                      onClick={handleSearchSubmit}
                    >
                      Buscar: "{localSearch}"
                    </div>

                  </div>
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

          <div className="auth-section">
            {user ? (
              <div className="user-menu">
                {isAdmin && <span className="admin-badge">Admin</span>}
                <img 
                  src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/32'} 
                  alt="Perfil" 
                  className="user-avatar"
                  title={user.email}
                />
                <button className="logout-btn" onClick={logout} title="Cerrar sesión">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                className="login-btn-premium" 
                onClick={loginWithGoogle} 
                title="Iniciar sesión"
                aria-label="Ingresar"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
