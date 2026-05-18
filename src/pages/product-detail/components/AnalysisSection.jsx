import React from 'react';

import RangeSelector from './RangeSelector';
import PriceHistoryChart from './PriceHistoryChart';

const AnalysisSection = ({
  product,
  filteredData,
  isDarkMode,
  isChanging,
  timeRange,
  handleRangeChange,
  toggleModal,
  formatCurrency
}) => {

  return (
    <section className="analysis-section">
      <div className="chart-container-pro">
        <div className="chart-header">
          <div className="title-group">
            <h3>Historial de Precios</h3>
            <button
              onClick={toggleModal}
              className="expand-btn"
              title="Agrandar gráfica"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line
                  x1="21"
                  y1="3"
                  x2="14"
                  y2="10"
                ></line>
                <line
                  x1="3"
                  y1="21"
                  x2="10"
                  y2="14"
                ></line>
              </svg>
            </button>
          </div>

          <RangeSelector
            timeRange={timeRange}
            handleRangeChange={handleRangeChange}
          />
        </div>

        <div
          className="chart-relative-wrapper"
          style={{
            width: '100%',
            height: 350,
            position: 'relative'
          }}
        >
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

      {/* STATS */}
      <div className="stats-grid-detail">
        <div className="stat-card-mini green">
          <span>Mínimo Histórico</span>
          <strong>
            {product.is_new
              ? "---"
              : formatCurrency(product.min_historical)}
          </strong>
        </div>

        <div className="stat-card-mini red">
          <span>Máximo Histórico</span>
          <strong>
            {product.is_new
              ? "---"
              : formatCurrency(product.max_historical)}
          </strong>
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

      {/* RECOMENDACIÓN */}
      <div
        className="stat-card-mini full-width-mobile"
        style={{
          borderTop: `4px solid ${product.rec_color}`,
          background: `${product.rec_color}10`
        }}
      >
        <span>Análisis de Mercado</span>
        <strong style={{ color: product.rec_color }}>
          {product.recommendation}
        </strong>
      </div>

      {/* TIMESTAMPS */}
      <div className="time-info-row">
        <div className="time-badge">
          Rastreado desde:
          <strong>
            {product.tracking_since.split(' ')[0]}
          </strong>
        </div>
        <div className="time-badge">
          Última actualización:
          <strong>
            {product.last_update}
          </strong>
        </div>
      </div>
    </section>
  );
};

export default AnalysisSection;