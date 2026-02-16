import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from './utility/Utils';
import './ProductDetail.css';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  ReferenceLine, Label
} from 'recharts';

const ProductDetail = ({ API_BASE, isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullDetail = async () => {
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

 // Ya no necesitamos calcular nada aquí. 
  // Usamos product.recommendation y product.rec_color directamente del Backend.
  const currentPrice = product.current_price || 0;

  return (
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
              {typeof product.previous_price === "number" &&
               product.previous_price > currentPrice && (
                  <div className="old-price-container">
                    <span className="label-small">Precio habitual</span>
                    <span className="old-price-value"><s>{formatCurrency(product.previous_price)}</s></span>
                  </div>
                )}
                <div className="current-price-container">
                  <span className="label-main">Precio Actual</span>
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
                  {product.status === "new" && <span className="status-new">Recién añadido</span>}
                  {product.status === "same" && <span className="status-stable">Precio estable</span>}
                  {product.status === "out_of_stock" && <span className="status-out">Agotado</span>}
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
                      
                      {/* --- LÍNEA DE REFERENCIA: LA MODA (ANCLA) --- */}
                      {!product.is_new &&
                        typeof product.baseline_price === "number" &&
                        product.baseline_price > 0 && (
                        <ReferenceLine 
                          y={product.baseline_price} 
                          stroke="#94a3b8" 
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        >
                          <Label 
                            value="Precio Mercado (30d)"
                            position="insideBottomRight" 
                            fill="#94a3b8" 
                            fontSize={10}
                            dy={-5}
                          />
                        </ReferenceLine>
                      )}

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
                  <span>Precio Base 30 días</span>
                  <strong>
                  {product.is_new || !product.baseline_price
                    ? "---"
                    : formatCurrency(product.baseline_price)}
                </strong>
                </div>
              </div>

             {/* RECOMENDACIÓN DIRECTA DEL BACKEND */}
              <div className="stat-card-mini full-width-mobile" 
                  style={{ borderTop: `4px solid ${product.rec_color}`, background: `${product.rec_color}10` }}>
                <span>Análisis de Mercado</span>
                <strong style={{ color: product.rec_color }}>{product.recommendation}</strong>
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