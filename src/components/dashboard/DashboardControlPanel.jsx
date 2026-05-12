import React from "react";
import "./DashboardControlPanel.css";
import { useSearchSync } from "../styles/animations";

function DashboardControlPanel({
  inputValue,
  handleInputChange,
  handleTrackProduct,
  refreshing,
  sortOption,
  setSortOption,
  filterOption,
  setFilterOption,
  setCurrentPage,
  handleResetAll,
  trackingMessage,
  loadingText,
  isExiting
}) {
  return (
    <div className="dashboard-control-panel">
      <div className="panel-header">
        <h3>Gestión de Catálogo</h3>
      </div>

      <div className="search-main-container">
        <div className="input-group-premium">

          <div className="search-icon-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <input
            type="text"
            placeholder={
              window.innerWidth < 600
                ? "pega URL o busca por nombre..."
                : "Pega URL de producto o busca por nombre..."
            }
            value={inputValue}
            onChange={handleInputChange}
          />

          <button
            className="btn-track-premium"
            onClick={handleTrackProduct}
            disabled={refreshing || !inputValue}
          >
            {refreshing ? "Procesando..." : "Rastrear Producto"}
          </button>

        </div>
      </div>

      <div className="filters-and-tools">
        <div className="filter-group">
          <div className="custom-select-container">
            <label>Ordenar por</label>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="date_desc">Más recientes</option>
              <option value="date_asc">Más antiguos</option>
              <option value="price_asc">Precio: Menor</option>
              <option value="price_desc">Precio: Mayor</option>
            </select>
          </div>

          <div className="custom-select-container">
            <label>Filtrar Estado</label>
            <select
              value={filterOption}
              onChange={(e) => {
                setFilterOption(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="available">Disponibles</option>
              <option value="all">Todos los registros</option>
              <option value="out_of_stock">Agotados</option>
              <option value="historical_low">Mín. Histórico</option>
              <option value="price_drop">Ofertas activas</option>
              <option value="new_products">Nuevos</option>
            </select>
          </div>

        </div>

        <button
          className="btn-clear-premium"
          onClick={handleResetAll}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="trash-icon"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>

          Limpiar filtros
        </button>

      </div>
        {/* Mensajes de estado integrados */}
      {(refreshing || trackingMessage) && (
        <div className={`status-bar-premium ${isExiting ? "fade-out" : ""}`}>
          <div className="spinner-sml"></div>

          <span>
            {refreshing ? loadingText : trackingMessage}
          </span>
        </div>
      )}
    </div>
  );
}

export default DashboardControlPanel;