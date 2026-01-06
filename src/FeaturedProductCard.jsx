import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturedProductCard = ({ product, setSearchTerm }) => {
  const navigate = useNavigate();

  // Función auxiliar simple
  const parsePrice = (priceString) => {
    if (!priceString) return 0;
    return parseFloat(priceString.toString().replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
  };

  // Protección de renderizado
  if (!product || !product.title || product.title === "Ninguna") return null;

  const outOfStock = product.status === "out_of_stock";
  const url = product.url || "";
  const isML = url.includes("mercadolibre");
  const isAmazon = url.includes("amazon");
  const storeName = isML ? "Mercado Libre" : isAmazon ? "Amazon" : "Tienda";
  const storeClass = isML ? "store-ml" : isAmazon ? "store-amazon" : "store-default";
  
  const currentPriceNum = parsePrice(product.price);
  const minHistoricalNum = parsePrice(product.min_historical_price);
  const modePriceNum = parsePrice(product.mode_price);
  
  // Lógica visual de Mínimo Histórico (Visual solamente)
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
          {/* Lógica Clásica: Si hay precio anterior y es diferente al actual, muéstralo */}
          {product.previous_price && product.previous_price !== product.price && (
            <p className="featured-previous-price">Antes: <s>{product.previous_price}</s></p>
          )}
          <p className="featured-current-price">
            <strong>{outOfStock ? "No disponible" : product.price}</strong>
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
            {(product.status === "stable" || !product.status) && (
               <span className="featured-status-stable">Sin cambios</span>
            )}
          </div>
        )}

        <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="featured-view-product-link">
          Ver producto original
        </a>
      </div>
    </div>
  );
};

export default FeaturedProductCard;