import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  paginationGroup,
  loading,
  onPageChange
}) => {
    
  if (totalPages <= 1) return null;

  return (
    <div className={`pagination-container ${loading ? 'pagination-pending' : ''}`}>

      <button
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
      >
        ‹
      </button>

      {paginationGroup.map((item, i) => (
        <button
          key={i}
          onClick={() =>
            typeof item === "number" && onPageChange(item)
          }
          className={`pagination-number ${currentPage === item ? 'active' : ''}`}
          disabled={item === "..." || loading}
        >
          {item}
        </button>
      ))}

      <button
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
      >
        ›
      </button>

    </div>
  );
};

export default Pagination;