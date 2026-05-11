import React from "react";

const ProductSkeleton = () => {
  return (
    <div className="product-card skeleton-card">

      <div className="skeleton-header"></div>

      <div className="skeleton-img"></div>

      <div className="skeleton-title-container">
        <div className="skeleton-title"></div>
        <div
          className="skeleton-title"
          style={{ width: "95%" }}
        ></div>
      </div>

      <div
        className="price-section"
        style={{ minHeight: "auto" }}
      >
        <div className="skeleton-price"></div>
      </div>

      <div className="status-row">
        <div className="skeleton-badge"></div>
      </div>

      <div className="skeleton-button"></div>

      <div className="skeleton-timestamp"></div>

    </div>
  );
};

export default ProductSkeleton;