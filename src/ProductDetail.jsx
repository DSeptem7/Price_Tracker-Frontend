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
        <div className="priority-badge">Prioridad de Rastreo: {product.priority}</div>
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

        {/* Lado Derecho: Gráfica y Estadísticas */}
        <section className="analysis-section">
          <div className="chart-container-pro">
            <h3>Historial de Precios (Tendencia Pro)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={product.history}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }}
                  formatter={(value) => [`$${value}`, 'Precio']}
                />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-grid-detail">
            <div className="stat-card-mini">
              <span>Mínimo Histórico</span>
              <strong>${product.min_historical.toLocaleString()}</strong>
            </div>
            <div className="stat-card-mini">
              <span>Puntos de Datos</span>
              <strong>{product.history.length}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;