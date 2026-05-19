import React from 'react';

const ProductDetailSkeleton = ({ isDarkMode }) => {
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
};

export default ProductDetailSkeleton;