import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from './utility/Utils';
import './ProductDetail.css';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const ProductDetail = ({ API_BASE, isDarkMode, setIsDarkMode, searchTerm, setSearchTerm }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullDetail = async () => {
// Log para verificar que el ID y la URL son correctos
console.log("Intentando cargar producto ID:", id);
console.log("URL generada:", `${API_BASE}/product/${id}`);

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/product/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error al obtener detalle:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullDetail();
  }, [id, API_BASE]);

  if (loading) {
    return (
      <div className="product-detail-wrapper">
        <div className={`detail-page ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="detail-container">
            <div className="skeleton sk-back-btn"></div>
            
            <div className="detail-layout">
              <section className="product-summary">
                <div className="skeleton sk-badge"></div>
                <div className="skeleton sk-image"></div>
                <div className="skeleton sk-title"></div>
                <div className="skeleton sk-container-dark sk-price-box"></div>
                <div className="skeleton sk-button"></div>
              </section>
  
              <section className="analysis-section">
                <div className="skeleton sk-chart-title"></div>
                <div className="skeleton sk-container-dark sk-chart"></div>
                <div className="stats-grid-detail">
                  <div className="skeleton sk-stat-card"></div>
                  <div className="skeleton sk-stat-card"></div>
                  <div className="skeleton sk-stat-card"></div>
                </div>
                <div className="skeleton sk-container-dark sk-analysis-box"></div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!product) return <div>Producto no encontrado.</div>;

  // --- LÓGICA DE ANÁLISIS (Ahora 100% numérica y segura) ---
  const currentPrice = product.current_price || 0;
  const modePrice = product.mode_price || 0;
  const minPrice = product.min_historical || 0;

  let finalRecommendation = product.recommendation;
  let finalColor = product.rec_color;

  // Ajuste de lógica de recomendación basado en números puros
  if (currentPrice === modePrice && modePrice > 0) {
      finalRecommendation = "Precio Estable. Es el precio habitual de este producto.";
      finalColor = "#64748b"; 
  } 
  else if (currentPrice <= minPrice && currentPrice < modePrice && currentPrice > 0) {
      finalRecommendation = "¡PRECIO MÍNIMO! Compra altamente recomendada.";
      finalColor = "#16a34a"; 
  }
    // ---------------------------------------

  return (
    /* CORRECCIÓN: El wrapper abre aquí y NO se cierra con /> */
    <div className="product-detail-wrapper">

      <div className={`detail-page ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="detail-container">
          <nav className="detail-nav">
            <button onClick={() => navigate('/')} className="back-btn">← Volver al Listado</button>
          </nav>

          <div className="detail-layout">
            <section className="product-summary">
              <div className="shop-badge-detail" 
                   style={{ backgroundColor: product.shop_color || '#fee600', color: product.shop_text_color || '#000' }}>
                <span className="shop-name">{product.shop_name || 'Mercado Libre'}</span>
              </div>

              <img src={product.image} alt={product.title} className="detail-img" />
              <h1>{product.title}</h1>
              
              <div className="price-focus">
                {product.previous_price && product.previous_price > currentPrice && (
                  <div className="old-price-container">
                    <span className="label-small">Precio anterior</span>
                    {/* CAMBIO: Uso de formatCurrency en lugar de toLocaleString manual */}
                    <span className="old-price-value"><s>{formatCurrency(product.previous_price)}</s></span>
                  </div>
                )}
                <div className="current-price-container">
                  <span className="label-main">Precio Actual</span>
                  {/* CAMBIO: Uso de formatCurrency */}
                  <span className="current-price-value">{formatCurrency(currentPrice)}</span>
                </div>
                
                <div className="status-badge-container">
                  {product.status === "down" && (
                    <span className="percentage-tag down">
                      ↓ -{product.change_percentage?.toFixed(2)}%
                    </span>
                  )}
                  {product.status === "up" && (
                    <span className="percentage-tag up">
                      ↑ +{product.change_percentage?.toFixed(2)}%
                    </span>
                  )}
                  {product.status === "stable" && <span className="status-stable">Sin cambios</span>}
                  {product.status === "new" && <span className="status-new">Recién añadido</span>}
                </div>
              </div>

              <a href={product.url} target="_blank" rel="noreferrer" className="buy-btn-main">
                Ver en Mercado Libre
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </section>

            <section className="analysis-section">
              <div className="chart-container-pro">
                <h3>Historial de Precios</h3>
                <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                    <AreaChart data={product.history} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      {/* CAMBIO: tickFormatter ahora usa formatCurrency para coherencia visual */}
                      <YAxis 
                        domain={['auto', 'auto']} 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                        tickFormatter={(v) => formatCurrency(v)} 
                        fontSize={12} tickLine={false} axisLine={false} 
                      />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                        fontSize={10} 
                        tickFormatter={(str) => str?.split(' ')[0]} 
                        tickLine={false} axisLine={false} minTickGap={30} 
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                      {/* CAMBIO: formatter del Tooltip usa formatCurrency */}
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '8px'}} 
                        formatter={(v) => [formatCurrency(v), 'Precio']} 
                      />
                      <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="stats-grid-detail">
                <div className="stat-card-mini green">
                  <span>Mínimo Histórico</span>
                  <strong>{product.is_new ? "---" : formatCurrency(product.min_historical)}</strong>
                </div>
                <div className="stat-card-mini red">
                  <span>Máximo Histórico</span>
                  <strong>{product.is_new ? "---" : formatCurrency(product.max_historical)}</strong>
                </div>
                <div className="stat-card-mini">
                  <span>Precio Frecuente</span>
                  <strong>{product.is_new ? "---" : formatCurrency(product.mode_price)}</strong>
                </div>
              </div>

              <div className="stat-card-mini full-width-mobile" 
                  style={{ borderTop: `3px solid ${finalColor}`, background: `${finalColor}10` }}>
                <span>Análisis de Mercado</span>
                <strong style={{ color: finalColor }}>{finalRecommendation}</strong>
              </div>
          
              <div className="time-info-row">
                <div className="time-badge">Rastreado desde: <strong>{product.tracking_since.split(' ')[0]}</strong></div>
                <div className="time-badge">Última actualización: <strong>{product.last_update}</strong></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div> /* Aquí cierra correctamente el wrapper */
  );
};

export default ProductDetail;