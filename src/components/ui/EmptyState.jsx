import React from "react";

const EmptyState = ({ onReset }) => {
  return (
    <div className="no-results-container">

      <div className="no-results-icon">

        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >

          <circle cx="11" cy="11" r="8"></circle>

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          ></line>

          <line
            x1="8"
            y1="11"
            x2="14"
            y2="11"
          ></line>

        </svg>

      </div>

      <h2>No encontramos coincidencias</h2>

      <p>
        Intenta ajustar los filtros o verifica que el nombre esté bien escrito.
      </p>

      <button
        className="clear-search-btn"
        onClick={onReset}
      >
        Restablecer búsqueda
      </button>

    </div>
  );
};

export default EmptyState;