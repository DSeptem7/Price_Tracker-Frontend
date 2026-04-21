import React, { useMemo } from "react";
import { Link } from "react-router-dom";

// 🔧 Si estas funciones están en App.jsx, luego las movemos a utils
import { formatCurrency } from "../../utils/format";
import { highlightText } from "../../utils/text";

const ProductCard = ({ product, query }) => {
  const isOut = product.status === "out_of_stock";
  const isNew =
    product.status === "new" ||
    product.alert_type === "Producto nuevo";

  // 🔥 evita recalcular highlight en cada render
  const highlightedTitle = useMemo(() => {
    return highlightText(product.title, query);
  }, [product.title, query]);

  return (
    <Link
      to={`/producto/${product.id}`}
      className={`product-card ${isOut ? "card-disabled" : ""}`}
    >
      {/* HEADER */}
      <div
        className={`store-header ${
          product.url?.includes("mercadolibre")
            ? "store-ml"
            : "store-default"
        }`}
      >
        {product.url?.includes("mercadolibre")
          ? "Mercado Libre"
          : "Tienda"}
      </div>

      {/* IMAGEN */}
      <div className="image-container">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/400x400?text=No+Img";
          }}
        />

        {isOut && <div className="alert-badge stock-badge">AGOTADO</div>}
        {!isOut && isNew && (
          <div className="alert-badge new-badge">NUEVO</div>
        )}
      </div>

      {/* TÍTULO */}
      <h3 className="product-title">{highlightedTitle}</h3>

      {/* PRECIO */}
      <div className="price-section">
        <div className="current-price-container">
          <span className={`current-price ${isOut ? "text-muted" : ""}`}>
            {isOut ? "No disponible" : formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* STATUS */}
      <div className="status-row">
        {!isOut && !isNew && (
          <span className={`state-badge priority-${product.state_priority}`}>
            {product.alert_type}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="card-action-button">
        {isOut ? "Consultar" : "Ver producto"}
      </div>

      {/* TIMESTAMP */}
      <p className="timestamp">
        {product.timestamp
          ? new Date(product.timestamp).toLocaleString()
          : ""}
      </p>
    </Link>
  );
};

export default ProductCard;