import React from "react";

const ProductSkeleton = () => {
  return (
    <div className="product-card skeleton-card">

      <div className="skeleton-header skeleton-shimmer"></div>

      <div className="skeleton-img skeleton-shimmer"></div>

      <div className="skeleton-title-container">
        <div className="skeleton-title skeleton-shimmer"></div>

        <div
          className="skeleton-title skeleton-shimmer"
          style={{ width: "95%" }}
        ></div>
      </div>

      <div
        className="price-section"
        style={{ minHeight: "auto" }}
      >
        <div className="skeleton-price skeleton-shimmer"></div>
      </div>

      <div className="status-row">
        <div className="skeleton-badge skeleton-shimmer"></div>
      </div>

      <div className="skeleton-button skeleton-shimmer"></div>

      <div className="skeleton-timestamp skeleton-shimmer"></div>

    </div>
  );
};

export default ProductSkeleton;