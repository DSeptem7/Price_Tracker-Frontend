import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturedProductCard = ({ product, setSearchTerm }) => {
  const navigate = useNavigate();

  // 1. Funciones de ayuda con protecciones contra nulos
  const parsePrice = (priceString) => {
    if (!priceString) return 0;
    return parseFloat(priceString.toString().replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
  };

  // 2. Si no hay producto todavía, no renderizamos nada (Evita el pantallazo blanco)
  if (!product || product.title === "Ninguna") return null;

  const outOfStock = product.status === "out_of_stock";
  const url = product.url || "";
  const isML = url.includes("mercadolibre");
  const isAmazon = url.includes("amazon");
  const storeName = isML ? "Mercado Libre" : isAmazon ? "Amazon" : "Tienda";
  const storeClass = isML ? "store-ml" : isAmazon ? "store-amazon" : "store-default";
  
  const currentPriceNum = parsePrice(product.price);
  const minHistoricalNum = parsePrice(product.min_historical_price);
  const modePriceNum = parsePrice(product.mode_price);
  
  const isAtHistoricalLow = currentPriceNum > 0 && 
                            Math.abs(currentPriceNum - minHistoricalNum) < 0.01 && 
                            currentPriceNum < modePriceNum && 
                            !outOfStock;

  return (
    <div 
      className="featured-product-card" 
      onClick={() => {
        if (setSearchTerm) setSearchTerm(""); 
        navigate(`/producto/${product.id}`);
      }}
      style={{ cursor: 'pointer' }}
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
          {/* PRECIO ANTERIOR RECUPERADO (Los $21,999) */}
          {product.true_previous_price && 
           parsePrice(product.true_previous_price) !== parsePrice(product.price) && (
            <p className="featured-previous-price">
              Antes: <s>${product.true_previous_price.toLocaleString()}</s>
            </p>
          )}

          <p className="featured-current-price">
            <strong>{outOfStock ? "No disponible" : product.price}</strong>
          </p>
        </div>

        {/* Resto del contenido protegido con opcionales */}
        {!outOfStock && (
          <div className="featured-status-row">
            {product.status === "down" && (
              <span className="featured-percentage-tag down">↓ -{product.change_percentage?.replace(/[()%-]/g, '')}%</span>
            )}
            {/* ... resto de tus condiciones ... */}
          </div>
        )}

        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          onClick={(e) => e.stopPropagation()}
          className="featured-view-product-link"
        >
          {outOfStock ? "Revisar disponibilidad" : "Ver producto original"}
        </a>
      </div>
    </div>
  );
};

export default FeaturedProductCard;