import React from "react";

import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";

import EmptyState from "../ui/EmptyState";

const ProductGrid = ({
  loading,
  itemsPerPage,
  products,
  query,
  onReset
}) => {

  // LOADING
  if (loading) {
    return (
      <div className="product-grid">

        {Array.from({
          length: itemsPerPage
        }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}

      </div>
    );
  }

  // EMPTY
  if (products.length === 0) {
    return (
      <EmptyState onReset={onReset} />
    );
  }

  // GRID
  return (
    <div className="product-grid">

      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          query={query}
        />
      ))}

    </div>
  );
};

export default ProductGrid;