import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const ProductDetail = ({ API_BASE, isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA EL NAVBAR QUE COPIAMOS
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef(null);

  // EFECTO: Si el usuario busca algo, lo mandamos a la home
  useEffect(() => {
    if (searchTerm !== "") {
      navigate('/');
    }
  }, [searchTerm, navigate]);

  useEffect(() => {
    const fetchFullDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/product/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullDetail();
  }, [id, API_BASE]);

  if (loading) return <div className="loading-state">Cargando análisis profundo...</div>;
  if (!product) return <div>Producto no encontrado.</div>;

  return (
    <div className={`detail-page ${isDarkMode ? 'dark' : 'light'}`}>
      {/* === COPIA DEL NAVBAR DE APP.JSX === */}
      <nav className="navbar">
        <div className="navbar-content">
          <span className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            🛒 Price Tracker (ML)
          </span>
          
          <div className="nav-controls">
            {/* BUSCADOR EXPANSIBLE */}
            <div ref={searchRef} className={`search-box ${isSearchExpanded ? 'expanded' : ''}`}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-svg">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
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
      
      <nav className="detail-nav">
        <button onClick={() => navigate('/')} className="back-btn">← Volver al Listado</button>
      </nav>

      <div className="detail-layout">
        {/* LADO IZQUIERDO: Imagen, Título, Precio y Status */}
        <section className="product-summary">
        {/* NUEVO: Badge de la tienda (Dinámico) */}
        <div className="shop-badge-detail" 
              style={{ backgroundColor: product.shop_color || '#fee600', color: product.shop_text_color || '#000' }}>
            <span className="shop-icon"></span> {/* Puedes cambiar esto por un logo luego */}
            <span className="shop-name">{product.shop_name || 'Mercado Libre'}</span>
          </div>

          <img src={product.image} alt={product.title} className="detail-img" />
          <h1>{product.title}</h1>
          
          <div className="price-focus">
          {product.previous_price && (
          <div className="old-price-container">
            <span className="label-small">Precio anterior</span>
            <span className="old-price-value"><s>${product.previous_price.toLocaleString()}</s></span>
          </div>
        )}
           {/* SECCIÓN DE PRECIO ACTUAL */}
          <div className="current-price-container">
            <span className="label-main">Precio Actual</span>
            <span className="current-price-value">${product.current_price.toLocaleString()}</span>
          </div>
            
            {/* ETIQUETA DE ESTADO */}
          <div className="status-badge-container">
            {product.status === "down" && <span className="percentage-tag down">↓ -{product.change_percentage}</span>}
            {product.status === "up" && <span className="percentage-tag up">↑ +{product.change_percentage}</span>}
            {product.status === "stable" && <span className="status-stable">Sin cambios</span>}
              {product.status === "new" && <span className="status-new">Recién añadido</span>}
            </div>
          </div>

         {/* BOTÓN DE MERCADO LIBRE */}
          <a href={product.url} target="_blank" rel="noreferrer" className="buy-btn-main">
            Ver en Mercado Libre
            {/* Icono de flecha opcional para darle más dinamismo */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </section>

        {/* LADO DERECHO: Gráfica y Estadísticas */}
        <section className="analysis-section">
          <div className="chart-container-pro">
            <h3>Historial de Precios</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={product.history} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} stroke={isDarkMode ? "#94a3b8" : "#64748b"} tickFormatter={(v) => `$${v.toLocaleString()}`} fontSize={12} tickLine={false} axisLine={false} />
                  <XAxis dataKey="timestamp" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickFormatter={(str) => str?.split(' ')[0]} tickLine={false} axisLine={false} minTickGap={30} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Precio']} />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CUADRICULA DE DATOS ENRIQUECIDA */}
              <div className="stats-grid-detail">
                <div className="stat-card-mini green">
                  <span>Mínimo Histórico</span>
                  <strong>{product.is_new ? "---" : `$${product.min_historical?.toLocaleString()}`}</strong>
                </div>
                <div className="stat-card-mini red">
                  <span>Máximo Histórico</span>
                  <strong>{product.is_new ? "---" : `$${product.max_historical?.toLocaleString()}`}</strong>
                </div>
                <div className="stat-card-mini">
                  <span>Precio Frecuente</span>
                  <strong>{product.is_new ? "---" : `$${product.mode_price?.toLocaleString()}`}</strong>
                </div>
              </div>

            {/* SEMÁFORO DE ESTADO */}
          <div className="stat-card-mini full-width-mobile" 
              style={{ borderTop: `3px solid ${product.rec_color}`, background: `${product.rec_color}10` }}>
            <span>Análisis de Mercado</span>
            <strong style={{ color: product.rec_color }}>
              {product.recommendation}
            </strong>
          </div>
      
              {/* NUEVA FILA: Tiempos de Rastreo */}
          <div className="time-info-row">
            <div className="time-badge">
              <span className="icon"></span> 
              Rastreado desde: <strong>{product.tracking_since.split(' ')[0]}</strong>
            </div>
            <div className="time-badge">
              <span className="icon"></span> 
              Última actualización: <strong>{product.last_update}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
