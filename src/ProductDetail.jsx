import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
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
        // Esta llamada activa el db_product.priority += 1 en tu app.py
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
      {/* Barra de Navegación Superior Interna */}
      <nav className="detail-nav">
        <button onClick={() => navigate('/')} className="back-btn">← Volver al Listado</button>
      </nav>

      <div className="detail-layout">
        {/* Lado Izquierdo: Info e Imagen */}
        <section className="product-summary">
          <img src={product.image} alt={product.title} className="detail-img" />
          <h1>{product.title}</h1>
          <div className="price-focus">
            <span className="label">Precio Actual</span>
            <span className="value">${product.current_price.toLocaleString()}</span>
          </div>
          <a href={product.url} target="_blank" rel="noreferrer" className="buy-btn">
            Ver en Mercado Libre
          </a>
        </section>

       {/* Lado Derecho: Gráfica con Ejes Profesionales */}
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
                  
                  {/* EJE VERTICAL (PRECIOS) */}
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                    tickFormatter={(value) => `$${value.toLocaleString()}`} // Formato moneda
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  {/* EJE HORIZONTAL (FECHAS/DÍAS) */}
                  <XAxis 
                    dataKey="timestamp" 
                    stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                    fontSize={10}
                    tickFormatter={(str) => {
                      // Cortamos el timestamp para mostrar solo la fecha (YYYY-MM-DD)
                      return str ? str.split(' ')[0] : '';
                    }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30} // Evita que se amontonen las fechas
                  />

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' 
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Precio']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />

                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    strokeWidth={3} 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="stats-grid-detail">
            <div className="stat-card-mini">
              <span>Mínimo Histórico</span>
              <strong>${product.min_historical.toLocaleString()}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;