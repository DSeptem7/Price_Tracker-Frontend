import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';
import './navbar.search.css';
import './navbar.utils.css';
import './navbar.results.css';
import './navbar.theme.css';
import './navbar.responsive.css';
import './navbar.auth.css';
import { useAutocomplete } from './search/useAutocomplete';
import SearchBox from './SearchBox';
import { fetchAutocomplete } from '../../services/api';

// NOTA: Ya no necesitamos recibir 'products' aquí porque la búsqueda es en el servidor
const Navbar = ({ isDarkMode, setIsDarkMode }) => {
  const API_BASE = "https://price-tracker-nov-2025.onrender.com";
  const { user, loginWithGoogle, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [localSearch, setLocalSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const autocomplete = useAutocomplete(API_BASE);

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

        <SearchBox
          value={localSearch}
          setValue={setLocalSearch}
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
          autocomplete={autocomplete}
          navigate={navigate}
        />
        
        <div style={{ flexGrow: 1 }}></div>

        <div className="nav-controls">
          
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
