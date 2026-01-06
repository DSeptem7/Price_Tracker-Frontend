// src/FeaturedProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturedProductCard = ({ product, setSearchTerm }) => {
  const navigate = useNavigate();

  // Asegúrate de tener estas funciones para manejar los precios y stock
  const parsePrice = (priceString) => parseFloat(priceString?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
  const isOutOfStock = (p) => p.status === "out_of_stock"; // Asegúrate de que tu `p.status` sea este

  const outOfStock = isOutOfStock(product);
  const isML = product.url.includes("mercadolibre");
  const isAmazon = product.url.includes("amazon");
  const storeName = isML ? "Mercado Libre" : isAmazon ? "Amazon" : "Tienda";
  const storeClass = isML ? "store-ml" : isAmazon ? "store-amazon" : "store-default";
  const currentPriceNum = parsePrice(product.price);
  const minHistoricalNum = parsePrice(product.min_historical_price);
  const modePriceNum = parsePrice(product.mode_price);
  const isAtHistoricalLow = currentPriceNum > 0 && Math.abs(currentPriceNum - minHistoricalNum) < 0.01 && currentPriceNum < modePriceNum && !outOfStock;

  return (
    <div 
      className="featured-product-card" 
      onClick={() => {
        // 1. LIMPIAR la búsqueda para que la navegación sea efectiva
        if (setSearchTerm) setSearchTerm(""); 
        
        // 2. NAVEGAR al detalle
        navigate(`/producto/${product.id}`);
      }}
      style={{ cursor: 'pointer', animationDelay: '0s' }}
    >
      <div className={`featured-store-header ${storeClass}`}>{storeName}</div>
      
      <div className="featured-image-container">
        <img src={product.image} alt={product.title} />
        {outOfStock && <div className="featured-badge stock-badge">🚫 SIN STOCK</div>}
        {isAtHistoricalLow && <div className="featured-badge low_historical">MÍNIMO HISTÓRICO</div>}
      </div>

      <div className="featured-info-container">
        <h3 className="featured-title">{product.title}</h3>
        
        <div className="featured-prices">
  {/* 1. Usamos 'product' en lugar de 'bestDiscount' */}
  {product?.true_previous_price && 
    parsePrice(product.true_previous_price) !== parsePrice(product.price) && (
      <p className="featured-previous-price">
        Antes: <s>${product.true_previous_price.toLocaleString()}</s>
      </p>
          )}

         {/* 2. Precio actual con validación de Stock usando 'product' */}
      <p className="featured-current-price">
        <strong>
          {product.status === "out_of_stock" ? "No disponible" : product.price}
        </strong>
      </p>
    </div>

        {!outOfStock && (
          <div className="featured-status-row">
            {product.status === "down" && (
              <span className="featured-percentage-tag down">↓ -{product.change_percentage?.replace(/[()%-]/g, '')}%</span>
            )}
            {product.status === "up" && (
              <span className="featured-percentage-tag up">↑ +{product.change_percentage?.replace(/[()%-]/g, '')}%</span>
            )}
            {(product.status === "equal" || product.status === "same" || product.status === "stable" || !product.status || product.status === "") && product.status !== "new" && (
              <span className="featured-status-stable">Sin cambios</span>
            )}
            {product.status === "new" && <span className="featured-status-new">Recién añadido</span>}
          </div>
        )}

        {!outOfStock && product.mode_price && (
          <div className="featured-context-box">
            <p><strong>Frecuente:</strong> {product.mode_price}</p>
            <p><strong>Mín. Registrado:</strong> {product.min_historical_price}</p>
          </div>
        )}

        <a 
          href={product.url} 
          target="_blank" 
          rel="noreferrer" 
          onClick={(e) => e.stopPropagation()}
          className="featured-view-product-link"
        >
          {outOfStock ? "Revisar disponibilidad" : "Ver producto original"}
        </a>
        
        <p className="featured-timestamp">Última actualización: {new Date(product.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default FeaturedProductCard;