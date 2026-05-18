import React from 'react';
import { formatCurrency } from '../../../utils/format';

const ProductSummary = ({ product, currentPrice }) => {
  return (
    <section className="product-summary">

      <div
        className="shop-badge-detail"
        style={{
          backgroundColor: product.shop_color || '#fee600',
          color: product.shop_text_color || '#000'
        }}
      >
        <span className="shop-name">
          {product.shop_name || 'Mercado Libre'}
        </span>
      </div>

      <img
        src={product.image}
        alt={product.title}
        className="detail-img"
      />

      <h1>{product.title}</h1>

      <div className="price-focus">

        <div className="current-price-container">
          <span className="label-main">Precio Actual</span>

          <span className="current-price-value">
            {formatCurrency(currentPrice)}
          </span>
        </div>

        <div className="status-badge-container">

          {typeof product.baseline_percentage === "number" &&
            product.baseline_price > 0 &&
            product.current_price > 0 && (

              product.current_price < product.baseline_price ? (
                <span className="percentage-tag down">
                  ↓ -{product.baseline_percentage.toFixed(2)}%
                </span>
              ) : product.current_price > product.baseline_price ? (
                <span className="percentage-tag up">
                  ↑ +{product.baseline_percentage.toFixed(2)}%
                </span>
              ) : null
            )}

          {product.status === "new" && (
            <span className="status-new">
              Recién añadido
            </span>
          )}

          {product.status === "same" && (
            <span className="status-stable">
              Precio estable
            </span>
          )}

          {product.status === "out_of_stock" && (
            <span className="status-out">
              Agotado
            </span>
          )}

        </div>
      </div>

      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="buy-btn-main"
      >
        Ver en Mercado Libre

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginLeft: '8px' }}
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>

          <polyline points="15 3 21 3 21 9"></polyline>

          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>

    </section>
  );
};

export default ProductSummary;