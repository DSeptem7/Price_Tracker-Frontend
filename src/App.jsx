import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar'; 
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import Footer from './Footer';
import { AuthProvider } from './context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./App.css";

// --- CONSTANTES GLOBALES ---
const API_BASE = "https://price-tracker-nov-2025.onrender.com";

// --- HELPERS (Utilidades Puras) ---
// Extraemos el parseo de precios para reutilizar y evitar errores NaN
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  // Si viene como número (float) del backend, lo usamos directo
  if (typeof priceStr === 'number') return priceStr;
  // Si viene como string "$1,200.00", limpiamos
  const cleanStr = priceStr.toString().replace(/[^0-9.]/g, "");
  return parseFloat(cleanStr) || 0;
};

// --- COMPONENTE MODAL (Sin cambios mayores, solo optimización visual) ---
function PriceChartModal({ productTitle, onClose, isDarkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const textColor = isDarkMode ? "#f1f5f9" : "#333";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#ccc";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Codificación robusta para evitar errores con caracteres especiales en URLs
        const safeKeyTitle = encodeURIComponent(productTitle.trim()); 
        const url = `${API_BASE}/history/${safeKeyTitle}`;
        const res = await fetch(url);
        
        if (res.status === 404) { setHistory([]); return; }
        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          const formattedData = data.history
            .map((item) => {
              const priceValue = parseFloat(item.price);
              if (isNaN(priceValue) || priceValue <= 0) return null; 
              return {
                price: priceValue,
                date: new Date(item.timestamp).toLocaleString("es-MX", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                }),
              };
            })
            .filter(Boolean); // Truco pro para filtrar nulos
          setHistory(formattedData);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Error historial:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [productTitle]);

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
                  formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]} 
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
  // 1. ESTADOS PRINCIPALES
  const [products, setProducts] = useState([]); // Ahora guardará solo los 20 de la página actual
  const [totalDocs, setTotalDocs] = useState(0); // <--- NUEVO: Total real en la DB (ej. 911)
  const [globalStats, setGlobalStats] = useState(null); // Para el stats-grid global
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Router Params
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || ""; // Fuente de verdad para búsqueda en BD
  
  // Estado Local del Input (Separado de la URL para permitir pegar links sin buscar)
  const [inputValue, setInputValue] = useState(urlQuery);

  // 2. CONFIGURACIÓN Y UX
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 600 ? 8 : 20); // Ajustado a 20 para backend
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("available");// Valores alineados con Backend (all, price_drop, available)
  
  // Helpers de estado visual
  const [trackingMessage, setTrackingMessage] = useState(""); 
  const [chartProductTitle, setChartProductTitle] = useState(null);
  const [loadingText, setLoadingText] = useState("Iniciando rastreo...");
  const [isExiting, setIsExiting] = useState(false);
  
  // Tema Oscuro/Claro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("isDarkMode");
      return savedTheme !== null ? savedTheme === "true" : true;
    } catch { return true; }
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

  // Sincronizar input local si la URL cambia externamente (navegación atrás/adelante)
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  // --- FETCHING DE DATOS (Backend Pagination & Filtering) ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Construimos la URL con los parámetros que el Backend espera
      // NOTA: El filtrado ahora ocurre en el SERVIDOR, no en el cliente.
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        filter_opt: filterOption, // Enviamos el filtro seleccionado (price_drop, historical_low, etc)
      });

      if (urlQuery) params.append("search", urlQuery);
      
      const res = await fetch(`${API_BASE}/product_history?${params.toString()}`);
      const data = await res.json();

      // Manejo de respuesta profesional (Objeto { total, products })
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalDocs(data.total);
      } else {
        setProducts([]);
        setTotalDocs(0);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, urlQuery, filterOption]); // filterOption ahora es dependencia del fetch

  // Ejecutar fetch cuando cambien las dependencias
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- ORDENAMIENTO (Cliente) ---
  // NOTA: Idealmente el sort debería ir al backend también, pero lo mantenemos
  // en cliente para esta iteración sobre la página actual.
  const processedProducts = useMemo(() => {
    let result = [...products];
    
    // El Backend ya filtró, aquí solo ordenamos lo que recibimos
    result.sort((a, b) => {
      const priceA = parsePrice(a.price);
      const priceB = parsePrice(b.price);
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);

      switch (sortOption) {
        case "price_asc": return priceA - priceB;
        case "price_desc": return priceB - priceA;
        case "date_asc": return dateA - dateB;
        default: return dateB - dateA; // date_desc
      }
    });
    return result;
  }, [products, sortOption]);
  
    // --- PAGINACIÓN ---
  const getPaginationGroup = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // --- HANDLERS ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetAll = () => {
    setSearchParams({}); // Limpia URL
    setInputValue("");   // Limpia Input Local
    setFilterOption("available"); // Reset a default seguro
    setSortOption("date_desc");
    setCurrentPage(1);
  };

 // MANEJO INTELIGENTE DEL INPUT
 const handleInputChange = (e) => {
  const val = e.target.value;
  setInputValue(val);

  // LÓGICA CRÍTICA:
  // Si es una URL, NO actualizamos la búsqueda (searchParams). Solo guardamos en local.
  // Si es texto normal, actualizamos searchParams para filtrar.
  const isUrl = val.includes("http") || val.includes(".com");
  
  if (!isUrl) {
    setCurrentPage(1);
    setSearchParams(val.trim() === "" ? {} : { q: val });
  }
};

// --- TRACKING NUEVO PRODUCTO ---
const handleTrackProduct = async () => {
  const isUrl = inputValue && inputValue.includes("mercadolibre.com");
  if (!isUrl) return; 
  
  setRefreshing(true); 
  setTrackingMessage(""); 
  setIsExiting(false);
  
  try {
    const url = `${API_BASE}/products?url=${encodeURIComponent(inputValue)}`;
    const res = await fetch(url);
    const result = await res.json();
    
    if (!res.ok) throw new Error(result.detail || "Error al rastrear.");
    
    setTrackingMessage(result.message); 
    setInputValue("");
    setSearchParams({});
    // Recargar lista completa
    fetchProducts();
    
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => { setTrackingMessage(""); setIsExiting(false); }, 600); 
    }, 5000);

  } catch (err) {
    setTrackingMessage(`Error: ${err.message}`); 
  } finally {
    setRefreshing(false);
  }
};

// --- HIGHLIGHTER ---
const highlightText = (text, query) => {
  if (!text || !query || query.includes("http")) return text;
  try {
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pattern = new RegExp(`(${normalizedQuery.split(" ").join("|")})`, 'gi');
    const parts = text.split(pattern);
    return parts.map((part, i) => 
      pattern.test(part) ? <mark key={i} className="highlight">{part}</mark> : part
    );
  } catch { return text; }
};

// --- ESTADÍSTICAS RÁPIDAS (De la página actual) ---
  // Nota: Estas estadísticas son "de la vista actual". 
  const currentViewStats = useMemo(() => {
    const drops = products.filter(p => p.status === "down").length;
    const stock = products.filter(p => p.status !== "out_of_stock").length;
    return { drops, stock };
  }, [products]);

  // --- CÁLCULO DE PÁGINAS (Usando totalDocs del servidor) ---
  const totalPages = Math.ceil(totalDocs / itemsPerPage);
   
   const loadingMessages = ["Conectando...", "Extrayendo información...", "Analizando precios...", "Verificando stock...", "¡Casi listo!"];
  useEffect(() => {
    let interval;
    if (refreshing) {
      let i = 0; setLoadingText(loadingMessages[0]);
      interval = setInterval(() => { i = (i + 1) % loadingMessages.length; setLoadingText(loadingMessages[i]); }, 3500);
    }
    return () => clearInterval(interval);
  }, [refreshing]);

  return (
    <AuthProvider>
      <div className={isDarkMode ? "dark-mode" : "light-mode"}>
        <div className="App">
          <ScrollToTop />
          <Navbar 
            products={products} 
            searchTerm={urlQuery} // Navbar ve la URL real
            setSearchTerm={setSearchParams} // Navbar actualiza URL (si tiene su propia barra)
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            productCount={totalDocs} 
          />
          
          <Routes>
            <Route path="/" element={
              <>
                {/* === CONTENEDOR PRINCIPAL === */}
        <main className="main-content">
          
          {/* === PANEL DE ESTADÍSTICAS === */}
          <div className="stats-grid">
                     <div className="stat-card">
                        <div className={`stat-indicator down ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Con descuento</span>
                           <span className="stat-value">{loading ? "..." : (globalStats?.dropCount || "0")}</span>
                        </div>
                     </div>
                     {/* ... Resto de cards ... */}
                     <div className="stat-card">
                        <div className={`stat-indicator up ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Subieron</span>
                           <span className="stat-value">{loading ? "..." : (globalStats?.upCount || "0")}</span>
                        </div>
                     </div>
                      <div className="stat-card">
                        <div className={`stat-indicator savings ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Ahorro detectado</span>
                           <span className="stat-value">{loading ? "..." : `$${(globalStats?.totalSavings || 0).toFixed(2)}`}</span>
                        </div>
                     </div>
                   
                  </div>
 
                  {/* Panel de Gestión */}
                  <div className="simulate-panel">
                      <div className="panel-header-row">
                          <h3>Gestión de Catálogo</h3>
                      </div>
                      <div className="control-row"> 
                          <input
                              type="text"
                              placeholder="Pega URL o busca por nombre..."
                              value={inputValue} // Usamos estado local
                              onChange={handleInputChange} // Usamos handler inteligente
                          />
                          <button className="btn-primary" onClick={handleTrackProduct} disabled={refreshing || !inputValue.includes("http")}>
                              {refreshing ? "Procesando..." : "Rastrear"}
                          </button>
                          <button className="btn-secondary" onClick={() => { handleResetAll(); }} disabled={refreshing}>
                              Actualizar
                          </button>
                      </div>

                      <div className="filter-row">
                          <div className="select-wrapper">
                              <label>Ordenar por</label>
                              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                                  <option value="date_desc">Más recientes</option>
                                  <option value="date_asc">Más antiguos</option>
                                  <option value="price_asc">Precio: Menor</option>
                                  <option value="price_desc">Precio: Mayor</option>
                              </select>
                          </div>
                          <div className="select-wrapper">
                              <label>Filtrar</label>
                              <select value={filterOption} onChange={(e) => { setFilterOption(e.target.value); setCurrentPage(1); }}>
                                  <option value="available">Disponibles</option>
                                  <option value="all">Todos</option>
                                  <option value="price_drop">Ofertas</option>
                                  <option value="historical_low">Mín. Histórico</option>
                                  <option value="new_products">Recién Agregados</option>
                                  <option value="out_of_stock">Agotados</option>
                              </select>
                          </div>
                          <button className="btn-reset-filters" onClick={handleResetAll}>Limpiar</button>
                      </div>

                      {/* Mensajes de Estado */}
                      {(refreshing || trackingMessage) && (
                        <div className={`status-message-container ${isExiting ? 'fade-out-message' : ''}`}>
                             {refreshing ? loadingText : trackingMessage}
                        </div>
                      )}
                  </div>
                  
                  {/* Paginación Superior */}
                  {totalPages > 1 && !loading && (
                    <div className="pagination-container">
                       <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                       {getPaginationGroup().map((item, i) => (
                           <button key={i} onClick={() => typeof item === 'number' && handlePageChange(item)} className={currentPage === item ? 'active' : ''} disabled={item === '...'}>{item}</button>
                       ))}
                       <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    </div>
                  )}

                  {/* Contador de Resultados */}
                  {!loading && (
                    <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                        {totalDocs} Productos encontrados
                      </span>
                    </div>
                  )}

                  {/* GRID DE PRODUCTOS */}
                  {loading ? (
                    <div className="product-grid">
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <div key={index} className="product-card skeleton-card">
                          <div className="skeleton-img"></div><div className="skeleton-title"></div>
                        </div>
                      ))}
                    </div>
                  ) : processedProducts.length === 0 ? (
                    <div className="no-results-container">
                      <h3>No se encontraron productos</h3>
                    <p>Intenta cambiar los filtros o añadir uno nuevo.</p>
                      <button className="clear-search-btn" onClick={handleResetAll}>Restablecer</button>
                    </div>
                  ) : (
                    <div className="product-grid">
                      {processedProducts.map((p) => {
                        // LÓGICA DE ESTADO (Usando la verdad del Backend)
                      const isOutOfStock = p.status === "out_of_stock";
                      const isLowHistorical = p.alert_type === "low_historical"; // Viene del backend
                      const isNew = p.status === "new";          
                        
                        return (
                          <Link key={p.id} to={`/producto/${p.id}`} className={`product-card ${isOutOfStock ? 'card-disabled' : ''}`}>
                            <div className={`store-header ${p.url.includes("mercadolibre") ? "store-ml" : "store-default"}`}>
                              {p.url.includes("mercadolibre") ? "Mercado Libre" : "Tienda"}
                            </div>
                            <div className="image-container">
                               <img src={p.image} alt={p.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400?text=No+Img"; }} />
                               {isOutOfStock && <div className="alert-badge stock-badge">AGOTADO</div>}
                             {isLowHistorical && <div className="alert-badge low_historical">MÍNIMO HISTÓRICO</div>}
                            </div>
                            <h3 className="product-title">{highlightText(p.title, urlQuery)}</h3>
                            
                            {!outOfStock && p.previous_price && <p className="previous-price">Antes: <s>{p.previous_price}</s></p>}
                            <p className="current-price"><strong>{outOfStock ? "No disponible" : p.price}</strong></p>
                            
                            {/* Tags de estado */}
                            <div className="status-row">
                              {!outOfStock && (
                                <>
                                  {/* BAJÓ: Muestra porcentaje y flecha abajo */}
                                  {p.status === "down" && (
                                    <span className="percentage-tag down">
                                      ↓ -{p.change_percentage?.replace(/[()%-]/g, '') || "0"}%
                                    </span>
                                  )}

                                  {/* SUBIÓ: Muestra porcentaje y flecha arriba */}
                                  {p.status === "up" && (
                                    <span className="percentage-tag up">
                                      ↑ +{p.change_percentage?.replace(/[()%-]/g, '') || "0"}%
                                    </span>
                                  )}

                                  {/* ESTABLE: Se activará si el status es same, stable, equal o viene vacío pero no es nuevo */}
                                  {(["equal", "same", "stable"].includes(p.status) || (!p.status && p.status !== "new")) && (
                                    <span className="status-stable">Sin cambios</span>
                                  )}

                                  {/* NUEVO: Producto recién ingresado al sistema */}
                                  {p.status === "new" && (
                                    <span className="status-new">Recién añadido</span>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="card-action-button">{outOfStock ? "Consultar" : "Ver producto"}</div>
                            <p className="timestamp">{new Date(p.timestamp).toLocaleString()}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Paginación Inferior */}
                  {totalPages > 1 && !loading && (
                     <div className="pagination-container">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                        {getPaginationGroup().map((item, i) => (
                            <button key={i} onClick={() => typeof item === 'number' && handlePageChange(item)} className={currentPage === item ? 'active' : ''} disabled={item === '...'}>{item}</button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                     </div>
                  )}
                </main>
              </>
            } />
            <Route path="/producto/:id" element={<ProductDetail API_BASE={API_BASE} isDarkMode={isDarkMode} />} />
          </Routes>
          <Footer />
          {chartProductTitle && <PriceChartModal productTitle={chartProductTitle} onClose={() => setChartProductTitle(null)} isDarkMode={isDarkMode} />}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;

