import React, { useEffect, useState } from "react";
import { Routes, Route, useSearchParams } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Pagination from "./components/pagination/Pagination";
import ProductGrid from "./components/product/ProductGrid";
import StatsPanel from "./components/dashboard/StatsPanel";
import DashboardControlPanel from "./components/dashboard/DashboardControlPanel";
import SearchResultsCount from "./components/ui/SearchResultsCount";
import { usePagination } from "./hooks/usePagination";
import { useProducts } from "./hooks/useProducts";
import { useTrackProduct } from "./hooks/useTrackProduct";
import { useSearchSync } from "./hooks/useSearchSync";
import { useStats } from "./hooks/useStats";
import { useTheme } from "./hooks/useTheme";
import { useResponsiveItemsPerPage } from "./hooks/useResponsiveItemsPerPage";
import { useFilters } from "./hooks/useFilters";
import { mapSortOption } from "./utils/sort";
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import Footer from './Footer';
import { AuthProvider } from './context/AuthContext';
import "./App.css";

// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 

  // Router y Navegación
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || ""; 
  const [inputValue, setInputValue] = useState(urlQuery);

  const itemsPerPage = useResponsiveItemsPerPage();

  // Configuración UX
  const [currentPage, setCurrentPage] = useState(1);

  const {
    sortOption,
    setSortOption,
    filterOption,
    setFilterOption,
    handleResetAll
  } = useFilters(
    setSearchParams,
    setInputValue,
    setCurrentPage
  );

  const {
    products,
    totalDocs,
    loading,
    fetchProducts
  } = useProducts({
    API_BASE,
    currentPage,
    itemsPerPage,
    urlQuery,
    sortOption,
    filterOption,
  });

  const { stats } = useStats(API_BASE);

  const { isDarkMode, setIsDarkMode } = useTheme();

  const {
    refreshing,
    trackingMessage,
    loadingText,
    isExiting,
    handleTrackProduct
  } = useTrackProduct({
    API_BASE,
    inputValue,
    setInputValue,
    setSearchParams,
    fetchProducts
  });

  const {
    totalPages,
    paginationGroup
  } = usePagination({
    totalDocs,
    itemsPerPage,
    currentPage
  });

      useSearchSync({
        inputValue,
        setInputValue,
        urlQuery,
        setSearchParams,
        setCurrentPage
      });

  // --- HANDLERS ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // --- Actualización de estados ---
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <AuthProvider>
      <div className={isDarkMode ? "dark-mode" : "light-mode"}>
        <div className="App">
          <ScrollToTop />
          <Navbar 
            products={products} 
            searchTerm={urlQuery} 
            setSearchTerm={setSearchParams} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            productCount={totalDocs} 
          />
          
          <Routes>
            <Route path="/" element={
              <>
                <main className="main-content">
                  
                  {/* === PANEL DE ESTADÍSTICAS (Respetando tu estructura Dashboard) === */}
                  <StatsPanel
                    stats={stats}
                    loading={loading}
                  />
 
                  {/* === DASHBOARD CONTROL PANEL === */}
                  <DashboardControlPanel
                    inputValue={inputValue}
                    handleInputChange={handleInputChange}
                    handleTrackProduct={handleTrackProduct}
                    refreshing={refreshing}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    filterOption={filterOption}
                    setFilterOption={setFilterOption}
                    setCurrentPage={setCurrentPage}
                    handleResetAll={handleResetAll}
                    trackingMessage={trackingMessage}
                    loadingText={loadingText}
                    isExiting={isExiting}
                  />
                  
                  {/* Paginación Superior */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginationGroup={paginationGroup}
                    loading={loading}
                    onPageChange={handlePageChange}
                  />

                  {/* Contador de Resultados - Ahora desaparece físicamente si no hay resultados */}
                  <SearchResultsCount
                    totalDocs={totalDocs}
                    loading={loading}
                    currentPage={currentPage}
                  />

                  {/* GRID DE PRODUCTOS */}
                  <ProductGrid
                    loading={loading}
                    itemsPerPage={itemsPerPage}
                    products={products}
                    query={urlQuery}
                    onReset={handleResetAll}
                  />

                  {/* Paginación Inferior */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginationGroup={paginationGroup}
                    loading={loading}
                    onPageChange={handlePageChange}
                  />

                </main>
              </>
            } />
            <Route path="/producto/:id" element={<ProductDetail API_BASE={API_BASE} isDarkMode={isDarkMode} />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;