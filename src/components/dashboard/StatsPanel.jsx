import React from "react";

import { formatCurrency } from "../../utils/format";

const StatsPanel = ({
  stats,
  loading
}) => {

  return (
    <div className="stats-grid">

      {/* DESCUENTOS */}
      <div className="stat-card">

        <div
          className={`stat-indicator down ${
            loading ? "loading-pulse" : ""
          }`}
        ></div>

        <div className="stat-info">

          <span className="stat-label">
            Con descuento
          </span>

          <span
            className={`stat-value ${
              loading ? "loading-text" : ""
            }`}
          >
            {loading
              ? "Cargando..."
              : `${stats.dropCount} productos`}
          </span>

        </div>

      </div>

      {/* INCREMENTOS */}
      <div className="stat-card">

        <div
          className={`stat-indicator up ${
            loading ? "loading-pulse" : ""
          }`}
        ></div>

        <div className="stat-info">

          <span className="stat-label">
            Con incremento de precio
          </span>

          <span
            className={`stat-value ${
              loading ? "loading-text" : ""
            }`}
          >
            {loading
              ? "Cargando..."
              : `${stats.upCount} productos`}
          </span>

        </div>

      </div>

      {/* AHORRO */}
      <div className="stat-card">

        <div
          className={`stat-indicator savings ${
            loading ? "loading-pulse" : ""
          }`}
        ></div>

        <div className="stat-info">

          <span className="stat-label">
            Ahorro detectado
          </span>

          <span
            className={`stat-value ${
              loading ? "loading-text" : ""
            }`}
          >
            {loading
              ? "Cargando..."
              : formatCurrency(stats.totalSavings)}
          </span>

        </div>

      </div>

      {/* MEJOR OFERTA */}
      <div
        className="stat-card clickable"
        onClick={() => {
          if (stats.bestDiscount?.id) {
            window.location.href = `/producto/${stats.bestDiscount.id}`;
          }
        }}
      >

        <div
          className={`stat-indicator star ${
            loading ? "loading-pulse" : ""
          }`}
        ></div>

        <div className="stat-info">

          <span className="stat-label">
            Mejor oferta
          </span>

          <span
            className={`stat-value small-text ${
              loading ? "loading-text" : ""
            }`}
          >

            {loading
              ? "Cargando..."
              : (
                  stats.bestDiscount?.percent > 0
                    ? `${stats.bestDiscount.percent}% (${stats.bestDiscount.title})`
                    : "Sin ofertas"
                )
            }

          </span>

        </div>

      </div>

    </div>
  );
};

export default StatsPanel;