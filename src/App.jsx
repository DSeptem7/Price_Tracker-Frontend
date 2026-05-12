import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import ProductCard from "./components/product/ProductCard";
import Pagination from "./components/pagination/Pagination";
import ProductGrid from "./components/product/ProductGrid";
import StatsPanel from "./components/dashboard/StatsPanel";
import DashboardControlPanel from "./components/dashboard/DashboardControlPanel";
import { usePagination } from "./hooks/usePagination";
import { useProducts } from "./hooks/useProducts";
import { useTrackProduct } from "./hooks/useTrackProduct";
import { useSearchSync } from "./hooks/useSearchSync";
import { mapSortOption } from "./utils/sort";
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import Footer from './Footer';
import { AuthProvider } from './context/AuthContext';
import { formatCurrency } from './utils/format';
import { highlightText } from './utils/text';
import "./App.css";

// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // Stats: Usamos un estado local que se calcula al recibir productos
  // Esto mantiene tu panel visualmente rico.
  const [stats, setStats] = useState({ dropCount: 0, upCount: 0, totalSavings: 0, bestDiscount: { percent: 0, title: "" } });

  // Router y Navegación
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || ""; 
  const [inputValue, setInputValue] = useState(urlQuery);

  // Configuración UX
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 600 ? 8 : 20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("available");
  
  // Mensajes y Alertas
  const [chartProductTitle, setChartProductTitle] = useState(null);
  
  // Tema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("isDarkMode");
      return savedTheme !== null ? savedTheme === "true" : true;
    } catch { return true; }
  });

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

  {
    chartProductTitle && (
      <PriceChartModal
        productTitle={chartProductTitle}
        onClose={() => setChartProductTitle(null)}
        apiBase={API_BASE}
        isDarkMode={isDarkMode}
      />
    )
  }

  // --- EFECTOS DE INICIALIZACIÓN ---
  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode);
    document.body.classList.toggle("dark-mode", isDarkMode);
    document.body.classList.toggle("light-mode", !isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(window.innerWidth < 600 ? 8 : 20);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

      useSearchSync({
        inputValue,
        setInputValue,
        urlQuery,
        setSearchParams,
        setCurrentPage
      });

        // CALCULO DE ESTADÍSTICAS (Sobre los datos recibidos o globales si el backend los envía)
        const fetchStats = useCallback(async () => {
          try {
            const res = await fetch(`${API_BASE}/stats/global`);
            const data = await res.json();
        
            setStats({
              dropCount: data.dropCount,
              upCount: data.upCount,
              totalSavings: data.totalSavings,
              bestDiscount: data.bestDiscount
            });
        
          } catch (err) {
            console.error("Error stats:", err);
          }
        }, []);
        
        useEffect(() => {
          fetchStats();
        }, []);

  // --- HANDLERS ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleResetAll = () => {
    setSearchParams({}); 
    setInputValue("");   
    setFilterOption("available");
    setSortOption("date_desc");
    setCurrentPage(1);
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
                    {(totalDocs > 0 || (loading && currentPage === 1)) && (
                      <div style={{ 
                        marginBottom: '15px', 
                        textAlign: 'right', 
                        minHeight: '24px'
                        // Eliminamos visibility: hidden porque el renderizado condicional se encarga
                      }}>
                        <span style={{ 
                          color: 'var(--text-muted)', 
                          fontWeight: '600',
                          opacity: (loading && currentPage === 1) ? 0.6 : 1, 
                          transition: 'opacity 0.2s ease'
                        }}>
                          {(loading && currentPage === 1) 
                            ? "Buscando..." 
                            : `${totalDocs} Productos encontrados`
                          }
                        </span>
                      </div>
                    )}

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
          {chartProductTitle && <PriceChartModal productTitle={chartProductTitle} onClose={() => setChartProductTitle(null)} apiBase={API_BASE} isDarkMode={isDarkMode} />}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;