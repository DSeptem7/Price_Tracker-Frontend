import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import ProductCard from "./components/product/ProductCard";
import { useProducts } from "./hooks/useProducts";
import { mapSortOption } from "./utils/sort";
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import Footer from './Footer';
import { AuthProvider } from './context/AuthContext';
import { formatCurrency } from './utils/format';
import { highlightText } from './utils/text';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./App.css";

// --- COMPONENTE MODAL (Optimizado y seguro) ---
function PriceChartModal({ productTitle, onClose, apiBase, isDarkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const textColor = isDarkMode ? "#f1f5f9" : "#333";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#ccc";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Sanitización estricta del título para la URL
        const safeKeyTitle = productTitle.trim().replace(/\s+/g, ' ').replace(/[/\+]/g, '_'); 
        const url = `${apiBase}/history/${encodeURIComponent(safeKeyTitle)}`;
        const res = await fetch(url);
        
        if (res.status === 404) { setHistory([]); return; }

        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          const formattedData = data.history.map((item) => {
            // CAMBIO: item.price ya viene como número del nuevo endpoint /history/{id}
            // Pero por seguridad mantenemos parseFloat o simplemente asignamos
            const priceValue = typeof item.price === 'number' ? item.price : parseFloat(item.price);
            
            if (isNaN(priceValue) || priceValue <= 0) return null; 
            return {
              price: priceValue,
              date: new Date(item.timestamp).toLocaleString("es-MX", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              }),
            };
        }).filter(item => item !== null);
          setHistory(formattedData);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Error al obtener historial:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [productTitle, apiBase]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <h3 style={{ color: textColor, marginTop: '20px', marginBottom: '20px' }}>
          Historial: {productTitle}
        </h3>
        {loading ? (
          <p style={{ color: textColor }}>Cargando historial...</p>
        ) : history.length > 1 ? ( 
          <div style={{ width: "100%", height: 300, paddingRight: '20px', outline: 'none' }}>
            <ResponsiveContainer style={{ outline: 'none' }}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: textColor, fontSize: 12 }} /> 
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)", 
                    color: textColor, border: `1px solid ${gridColor}`, borderRadius: '8px'
                  }}
                  // CAMBIO AQUÍ: Usar formatCurrency en lugar de f-string manual
                  formatter={(value) => [formatCurrency(value), "Precio"]}
                />
                <Legend />
                <Line type="monotone" dataKey="price" stroke={isDarkMode ? "#3b82f6" : "#8884d8"} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: textColor }}>No hay suficiente historial para mostrar una gráfica.</p>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL APP ---
function App() {
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // Stats: Usamos un estado local que se calcula al recibir productos
  // Esto mantiene tu panel visualmente rico.
  const [stats, setStats] = useState({ dropCount: 0, upCount: 0, totalSavings: 0, bestDiscount: { percent: 0, title: "" } });

  const [refreshing, setRefreshing] = useState(false);
  
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
  const [trackingMessage, setTrackingMessage] = useState(""); 
  const [chartProductTitle, setChartProductTitle] = useState(null);
  const [loadingText, setLoadingText] = useState("Iniciando rastreo...");
  const [isExiting, setIsExiting] = useState(false);
  
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
    totalPages,
    getPaginationGroup,
    fetchProducts
  } = useProducts({
    API_BASE,
    currentPage,
    itemsPerPage,
    urlQuery,
    sortOption,
    filterOption,
    mapSortOption,
    setRefreshing
  });

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

  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  // --- MENSAJES DE CARGA (Respetando tu array original) ---
  const loadingMessages = ["Conectando...", "Extrayendo información...", "Analizando precios...", "Verificando stock...", "¡Casi listo!"];
  useEffect(() => {
    let interval;
    if (refreshing) {
      let i = 0; setLoadingText(loadingMessages[0]);
      interval = setInterval(() => { i = (i + 1) % loadingMessages.length; setLoadingText(loadingMessages[i]); }, 3500);
    }
    return () => clearInterval(interval);
  }, [refreshing]);

  // 2. La "inteligencia" se va al Debounce
useEffect(() => {
  const val = inputValue;
  const isUrl = val.includes("http") || val.includes(".com");

  // Si es una URL o es igual a lo que ya hay en la URL, no hacemos nada
  if (isUrl || val === urlQuery) return;

  const timer = setTimeout(() => {
    setCurrentPage(1); // Tu lógica original: resetear página al buscar
    
    if (val.trim() === "") {
      setSearchParams({}); 
    } else {
      setSearchParams({ q: val }); // Esto dispara fetchProducts automáticamente
    }
  }, 500); // 500ms de espera

  return () => clearTimeout(timer);
}, [inputValue, urlQuery, setSearchParams]);

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

  // --- TRACK PRODUCT ---
  const handleTrackProduct = async () => {
    const isUrl = inputValue && inputValue.includes("http") && inputValue.includes("mercadolibre.com");
    if (!isUrl) return; 
    
    setRefreshing(true); 
    setTrackingMessage(""); 
    setIsExiting(false);
    
    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(inputValue)}`;
      const res = await fetch(url);
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.detail || "Error desconocido.");
      
      setTrackingMessage(result.message); 
      setInputValue(""); 
      setSearchParams({}); 
      fetchProducts(); // Recarga limpia
      
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => { setTrackingMessage(""); setIsExiting(false); }, 600); 
      }, 6000);

    } catch (err) {
      setTrackingMessage(`Error: ${err.message}`); 
    } finally {
      setRefreshing(false);
    }
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
                  <div className="stats-grid">
                     <div className="stat-card">
                        <div className={`stat-indicator down ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Con descuento</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? ("Cargando...") : (`${stats.dropCount} productos`)}</span>
                        </div>
                     </div>
                     <div className="stat-card">
                        <div className={`stat-indicator up ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Con incremento de precio</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? ("Cargando...") : (`${stats.upCount} productos`)}</span>
                        </div>
                     </div>
                      <div className="stat-card">
                        <div className={`stat-indicator savings ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Ahorro detectado</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? "Cargando..." : formatCurrency(stats.totalSavings)}</span>
                        </div>
                     </div>
                     <div 
                        className="stat-card clickable"
                        onClick={() => {
                          if (stats.bestDiscount.id) {
                            window.location.href = `/producto/${stats.bestDiscount.id}`;
                          }
                        }}
                      >
                        <div className={`stat-indicator star ${loading ? 'loading-pulse' : ''}`}></div>

                        <div className="stat-info">
                          <span className="stat-label">Mejor oferta</span>

                          <span className={`stat-value small-text ${loading ? 'loading-text' : ''}`}>
                            {loading 
                              ? "Cargando..." 
                              : (
                                  stats.bestDiscount.percent > 0
                                    ? `${stats.bestDiscount.percent}% (${stats.bestDiscount.title})`
                                    : "Sin ofertas"
                                )
                            }
                          </span>
                        </div>
                      </div>
                  </div>
 
                  {/* === DASHBOARD CONTROL PANEL === */}
                  <div className="dashboard-control-panel">
                      <div className="panel-header">
                        <h3>Gestión de Catálogo</h3>
                      </div>

                      <div className="search-main-container">
                        <div className="input-group-premium">
                          <div className="search-icon-wrapper">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          </div>
                          <input
                            type="text"
                            placeholder={window.innerWidth < 600 ? "pega URL o busca por nombre..." : "Pega URL de producto o busca por nombre..."}
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
                            <select value={sortOption} onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}>
                              <option value="date_desc">Más recientes</option>
                              <option value="date_asc">Más antiguos</option>
                              <option value="price_asc">Precio: Menor</option>
                              <option value="price_desc">Precio: Mayor</option>
                            </select>
                          </div>

                          <div className="custom-select-container">
                            <label>Filtrar Estado</label>
                            <select value={filterOption} onChange={(e) => { setFilterOption(e.target.value); setCurrentPage(1); }}>
                              <option value="available">Disponibles</option>
                              <option value="all">Todos los registros</option>
                              <option value="out_of_stock">Agotados</option>
                              <option value="historical_low">Mín. Histórico</option>
                              <option value="price_drop">Ofertas activas</option>
                              <option value="new_products">Nuevos</option>
                            </select>
                          </div>
                        </div>

                        <button className="btn-clear-premium" onClick={handleResetAll}>
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
                        <div className={`status-bar-premium ${isExiting ? 'fade-out' : ''}`}>
                          <div className="spinner-sml"></div>
                          <span>{refreshing ? loadingText : trackingMessage}</span>
                        </div>
                      )}
                    </div>
                  
                  {/* Paginación Superior */}
                  {totalPages >= 1 && (
                    <div className={`pagination-container ${loading ? 'pagination-pending' : ''}`}>
                      <button 
                        className="pagination-arrow"
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1 || loading} // Bloqueamos clics durante la carga
                      >
                        ‹
                      </button>
                      
                      {getPaginationGroup().map((item, i) => (
                        <button 
                          key={i} 
                          onClick={() => typeof item === 'number' && handlePageChange(item)} 
                          className={`pagination-number ${currentPage === item ? 'active' : ''}`} 
                          disabled={item === '...' || loading} // Bloqueamos clics durante la carga
                        >
                          {item}
                        </button>
                      ))}
                      
                      <button 
                        className="pagination-arrow"
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages || loading}
                      >
                        ›
                      </button>
                    </div>
                  )}

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
                  {loading ? (
                    <div className="product-grid">
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <div key={index} className="product-card skeleton-card">
                          {/* 1. Header de tienda */}
                          <div className="skeleton-header"></div> 
                          
                          {/* 2. Imagen */}
                          <div className="skeleton-img"></div>
                          
                          {/* 3. Título (Dos líneas robustas) */}
                          <div className="skeleton-title-container">
                            <div className="skeleton-title"></div>
                            <div className="skeleton-title" style={{ width: '95%' }}></div>
                          </div>
                          
                          {/* 4. Sección de Precio (Centrada) */}
                          <div className="price-section" style={{ minHeight: 'auto' }}>
                            <div className="skeleton-price"></div>
                          </div>
                          
                          {/* 5. Estado del producto (Con línea divisoria) */}
                          <div className="status-row">
                            <div className="skeleton-badge"></div>
                          </div>
                          
                          {/* 6. Botón y Timestamp */}
                          <div className="skeleton-button"></div>
                          <div className="skeleton-timestamp"></div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="no-results-container">
                      <div className="no-results-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line> {/* Una pequeña línea horizontal simulando 'vacío' */}
                        </svg>
                      </div>
                      <h2>No encontramos coincidencias</h2>
                      <p>Intenta ajustar los filtros o verifica que el nombre esté bien escrito.</p>
                      <button className="clear-search-btn" onClick={handleResetAll}>
                        Restablecer búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="product-grid">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        query={urlQuery}
                      />
                    ))}
                  </div>
                  )}

                  {/* Paginación Inferior */}
                  {totalPages > 1 && (
                    <div className={`pagination-container ${loading ? 'pagination-pending' : ''}`}>
                      <button 
                        className="pagination-arrow"
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1 || loading} // Bloqueamos clics durante la carga
                      >
                        ‹
                      </button>
                      
                      {getPaginationGroup().map((item, i) => (
                        <button 
                          key={i} 
                          onClick={() => typeof item === 'number' && handlePageChange(item)} 
                          className={`pagination-number ${currentPage === item ? 'active' : ''}`} 
                          disabled={item === '...' || loading} // Bloqueamos clics durante la carga
                        >
                          {item}
                        </button>
                      ))}
                      
                      <button 
                        className="pagination-arrow"
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages || loading}
                      >
                        ›
                      </button>
                    </div>
                  )}
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