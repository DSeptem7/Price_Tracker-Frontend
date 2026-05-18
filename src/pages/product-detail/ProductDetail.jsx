import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import { formatCurrency } from '../../utils/format';
import { useProductDetail } from './hooks/useProductDetail';
import PriceChartModal from "../../components/modal/PriceChartModal";
import { getFilteredChartData } from './utils/chartFilters';
import ProductSummary from './components/ProductSummary';
import PriceHistoryChart from './components/PriceHistoryChart';

const ProductDetail = ({ API_BASE, isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('3m');
  const [isChanging, setIsChanging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

const {
  product,
  chartData,
  loading
} = useProductDetail(API_BASE, id);

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

  const filteredData = getFilteredChartData(chartData, timeRange);

  // 1. Función para manejar el cambio de rango con un pequeño delay para el spinner
const handleRangeChange = (range) => {
  setIsChanging(true);
  setTimeRange(range);
  
  // Simulamos un breve procesamiento (300ms) para que el spinner sea visible 
  // y la transición no sea brusca
  setTimeout(() => {
    setIsChanging(false);
  }, 300);
};

// Función para alternar el modal
const toggleModal = () => {
  setIsModalOpen(!isModalOpen);
  // Tip profesional: Bloqueamos el scroll del cuerpo cuando el modal está abierto
  if (!isModalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
};




  return (
    <div className="product-detail-wrapper">

      <div className={`detail-page ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="detail-container">
          <nav className="detail-nav">
            <button onClick={() => navigate('/')} className="back-btn">← Volver al Listado</button>
          </nav>

          <div className="detail-layout">
          <ProductSummary
            product={product}
            currentPrice={currentPrice}
          />

            <section className="analysis-section">
              <div className="chart-container-pro">
              <div className="chart-header">
                <div className="title-group">
                  <h3>Historial de Precios</h3>
                  <button onClick={toggleModal} className="expand-btn" title="Agrandar gráfica">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <polyline points="9 21 3 21 3 15"></polyline>
                      <line x1="21" y1="3" x2="14" y2="10"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                  </button>
                </div>
                  
                  {/* Botones de temporalidad */}
                  <div className="range-selector">
                    {['1m', '3m', '6m', '1y', 'all'].map((range) => (
                      <button
                        key={range}
                        onClick={() => handleRangeChange(range)}
                        className={`range-btn ${timeRange === range ? 'active' : ''}`}
                      >
                        {range === 'all' ? 'Todo' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chart-relative-wrapper" style={{ width: '100%', height: 350, position: 'relative' }}>
                {isChanging && <div className="chart-spinner-overlay"><div className="chart-spinner"></div></div>}
                <PriceHistoryChart
                  filteredData={filteredData}
                  product={product}
                  isDarkMode={isDarkMode}
                  isChanging={isChanging}
                />
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

      {/* MODAL DE GRÁFICA EXPANDIDA (Fuera del layout principal pero dentro del wrapper) */}
      {isModalOpen && (
            <div className="chart-modal-overlay" onClick={toggleModal}>
              <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
                
                {/* AVISO DE ROTACIÓN: Solo visible en móviles vertical */}
                <div className="rotation-suggestion">
                  <div className="phone-icon-wrapper">
                    <svg className="phone-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    <svg className="rotate-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6"></path>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                  </div>
                  <span>Gira tu dispositivo para una mejor vista</span>
                </div>
                
                <div className="modal-header">
                <div className="modal-title-group">
                  <h4>Análisis Detallado</h4>
                  <span className="modal-product-name">{product.title}</span>
                </div>
                
                {/* Agregamos los botones aquí también */}
                <div className="range-selector modal-ranges">
                  {['1m', '3m', '6m', '1y', 'all'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleRangeChange(range)}
                      className={`range-btn ${timeRange === range ? 'active' : ''}`}
                    >
                      {range === 'all' ? 'Todo' : range.toUpperCase()}
                    </button>
                  ))}
                </div>
                  
                <button className="close-modal" onClick={toggleModal} title="Cerrar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                </div>

                <div className="modal-chart-container">
                  {/* El spinner también debe verse en el modal si el usuario cambia el rango */}
                  {isChanging && (
                    <div className="chart-spinner-overlay">
                      <div className="chart-spinner"></div>
                    </div>
                  )}
                <PriceHistoryChart
                  filteredData={filteredData}
                  product={product}
                  isDarkMode={isDarkMode}
                  isChanging={isChanging}
                />
                </div>
              </div>
            </div>
          )}
        </div>
  );
};

export default ProductDetail;
