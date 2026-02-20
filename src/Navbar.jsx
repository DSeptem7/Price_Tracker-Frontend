import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

// NOTA: Ya no necesitamos recibir 'products' aquí porque la búsqueda es en el servidor
const Navbar = ({ setSearchTerm, isDarkMode, setIsDarkMode, productCount }) => {
  const { user, loginWithGoogle, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [localSearch, setLocalSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null); 

  // --- NUEVA LÓGICA SIMPLIFICADA ---
  const handleInputChange = (e) => {
    setLocalSearch(e.target.value);
    // YA NO FILTRAMOS LOCALMENTE (products.filter)
    // Porque 'products' solo tiene 20 items y daría falsos negativos.
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
          style={{ cursor: 'pointer', flexGrow: 0, marginRight: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          🛒 Price Tracker
        </span>
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
          <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
            <input 
              ref={inputRef} 
              type="text" 
              className="search-input" 
              placeholder="Buscar en todo el catálogo..." 
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
            {/* En lugar de sugerencias falsas, guiamos al usuario */}
            {isSearchExpanded && localSearch.length > 0 && (
              <div className="live-search-results">
                 <div 
                    className="view-all-results"
                    onClick={handleSearchSubmit}
                    style={{ cursor: 'pointer', textAlign: 'left', padding: '12px' }}
                  >
                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                      Presiona <strong>Enter</strong> para buscar:
                    </span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                      "{localSearch}"
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', color: '#888' }}>
                      Buscando en servidor...
                    </span>
                 </div>
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
