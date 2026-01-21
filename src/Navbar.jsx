import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ products, setSearchTerm, isDarkMode, setIsDarkMode }) => {
  const { user, loginWithGoogle, logout, isAdmin } = useAuth();

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
  
    // Función interna para quitar acentos y pasar a minúsculas
    const normalizeText = (str) => {
      return str
        .toLowerCase()
        .normalize("NFD") // Descompone caracteres (ej: 'á' -> 'a' + '´')
        .replace(/[\u0300-\u036f]/g, ""); // Elimina las tildes
    };
  
    if (text.length > 0 && products) {
      const searchTextNormalized = normalizeText(text);

      // .split(" ") divide por espacios, .filter verifica que no sean espacios vacíos
      const searchTokens = searchTextNormalized.split(/\s+/).filter(token => token.length > 0);

      const matches = products.filter(p => {
        const titleNormalized = normalizeText(p.title);
        // Verificamos que TODOS los tokens de búsqueda estén incluidos en el título
        return searchTokens.every(token => titleNormalized.includes(token));
      });
  
      setFilteredSuggestions(matches);
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Función FINAL: Ejecuta la búsqueda global y cambia de página
  const handleSearchSubmit = () => {
    if (localSearch.trim() === "") return; // No buscar si está vacío
    
    // 1. Cerramos la barra y limpiamos sugerencias visuales
    setIsSearchExpanded(false);
    setFilteredSuggestions([]);
    
    // 2. CAMBIO CLAVE: Navegamos poniendo la búsqueda en la URL
    // encodeURIComponent asegura que espacios y tildes no rompan el link
    navigate(`/?q=${encodeURIComponent(localSearch)}`);
    
    setLocalSearch(""); 
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
            
            {/* NUEVO: Botón X para limpiar. Solo aparece si localSearch tiene contenido */}
            {isSearchExpanded && localSearch && (
              <button 
                className="clear-search-x" 
                onClick={() => {
                  setLocalSearch("");
                  inputRef.current?.focus(); // Mantiene el teclado abierto
                }}
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}

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
                  <Link 
                    key={p.id} 
                    to={`/producto/${p.id}`} // Permite que el navegador lo reconozca como un enlace real
                    className="search-result-item"
                    onClick={() => {
                      // Mantenemos la limpieza de la barra al hacer clic normal
                      setIsSearchExpanded(false);
                      setLocalSearch(""); 
                    }}
                  >
                    <img src={p.image} alt="" className="mini-thumb" />
                    <div className="mini-info">
                      <span className="mini-title">
                        {highlightText(p.title, localSearch)}
                      </span>
                      <span className="mini-price">{p.price}</span>
                    </div>
                  </Link>
                ))}
                    
                    <Link
                      /* Apuntamos a la URL con el parámetro 'q' */
                      to={`/?q=${encodeURIComponent(localSearch)}`}
                      className="view-all-results"
                      onClick={() => {
                        setIsSearchExpanded(false);
                        setFilteredSuggestions([]);
                        setLocalSearch("");
                        /* Ya no llamamos a setSearchTerm ni navigate aquí, el 'to' hace el trabajo */
                      }}
                    >
                      Ver más resultados para "{localSearch}"
                    </Link>
                  </>
                ) : (
                  <div className="no-results-live">
                    <div className="no-results-icon-mini">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                        <path d="M8 11h6"></path>
                      </svg>
                    </div>
                    <p>No hay coincidencias para tu búsqueda</p>
                    <span className="search-tip">Prueba con palabras más generales</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- NUEVO: SECCIÓN DE USUARIO --- */}
          <div className="auth-section">
            {user ? (
              <div className="user-menu">
                {/* Si es admin, mostramos un distintivo o botón extra */}
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
              <button className="login-btn" onClick={loginWithGoogle}>
                Iniciar Sesión
              </button>
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

const highlightText = (text, query) => {
  if (!query || !text) return text;

  // 1. Normalizamos y obtenemos los tokens (palabras)
  const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tokens = normalize(query).split(/\s+/).filter(t => t.length > 0);

  if (tokens.length === 0) return text;

  // 2. Creamos una expresión regular que busque todos los tokens a la vez
  // El flag 'gi' es para Global e Ignore Case.
  // Usamos un truco: buscamos las palabras pero escapando caracteres raros.
  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <span>
      {parts.map((part, i) => 
        tokens.some(t => normalize(t) === normalize(part)) ? 
          <mark key={i} className="highlight">{part}</mark> : 
          part
      )}
    </span>
  );
};

export default Navbar;
