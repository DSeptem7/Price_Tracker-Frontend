import React, { useEffect, useState, useCallback } from "react";
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

// --- HELPERS GLOBALES (Blindaje de datos) ---
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  const cleanStr = priceStr.toString().replace(/[^0-9.]/g, "");
  return parseFloat(cleanStr) || 0;
};

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
              const priceValue = parseFloat(item.price);
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
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 

  // 1. ESTADOS DE DATOS
  const [products, setProducts] = useState([]); 
  const [totalDocs, setTotalDocs] = useState(0);
  
  // Stats: Usamos un estado local que se calcula al recibir productos
  // Esto mantiene tu panel visualmente rico.
  const [stats, setStats] = useState({ dropCount: 0, upCount: 0, totalSavings: 0, bestDiscount: { percent: 0, title: "" } });

  const [loading, setLoading] = useState(true);
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

  // --- LÓGICA DE DATOS (SCALABLE & PROFESSIONAL) ---
  // Aquí está la corrección clave: Enviamos filtros y orden al backend.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sort_opt: sortOption,     // CRÍTICO: El backend ordena
        filter_opt: filterOption  // CRÍTICO: El backend filtra
      });
      
      if (urlQuery) params.append("search", urlQuery);

      const res = await fetch(`${API_BASE}/product_history?${params.toString()}`);
      const data = await res.json();

      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalDocs(data.total);

        // CALCULO DE ESTADÍSTICAS (Sobre los datos recibidos o globales si el backend los envía)
        // Por ahora calculamos sobre la vista actual para mantener tu Dashboard vivo
        const currentProducts = data.products;
        const drops = currentProducts.filter(p => p.status === "down");
        const ups = currentProducts.filter(p => p.status === "up");
        
        const totalSavings = drops.reduce((acc, p) => {
            const curr = parsePrice(p.price);
            const prev = parsePrice(p.previous_price);
            return acc + (prev > curr ? prev - curr : 0);
        }, 0);

        let best = { title: "Ninguna", percent: 0 };
        drops.forEach(p => {
             const pVal = parseFloat(p.change_percentage?.replace(/[^\d.]/g, '') || 0);
             if (pVal > best.percent) best = { title: p.title, percent: pVal };
        });

        setStats({ 
            dropCount: drops.length, 
            upCount: ups.length, 
            totalSavings: totalSavings, 
            bestDiscount: best 
        });

      } else {
        setProducts([]);
        setTotalDocs(0);
        setStats({ dropCount: 0, upCount: 0, totalSavings: 0, bestDiscount: { percent: 0, title: "" } });
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, urlQuery, sortOption, filterOption]); 
  // Nota: Al añadir sortOption y filterOption aquí, el fetch se dispara automático al cambiar el select.

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

 const handleInputChange = (e) => {
  const val = e.target.value;
  setInputValue(val);
  const isUrl = val.includes("http") || val.includes(".com");
  
  if (!isUrl) {
    setCurrentPage(1);
    if (val.trim() === "") setSearchParams({});
    else setSearchParams({ q: val });
  }
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

  // --- HIGHLIGHTER ROBUSTO (Evita crashes con Regex) ---
  const highlightText = (text, query) => {
    if (!text || typeof text !== 'string') return "";
    if (!query || typeof query !== 'string') return text;
    if (query.includes("http") || query.includes(".com")) return text;

    const normalize = (str) => {
        try { return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch { return ""; }
    };

    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return text;

    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return text;

    try {
      const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
      const parts = text.split(pattern);
      return (
        <>
          {parts.map((part, i) => {
             if (!part) return null;
             return tokens.some(t => normalize(t) === normalize(part)) 
                ? <mark key={i} className="highlight">{part}</mark> 
                : part;
          })}
        </>
      );
    } catch { return text; }
  };

  // --- PAGINACIÓN ---
  const totalPages = Math.ceil(totalDocs / itemsPerPage);
  const getPaginationGroup = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
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
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? "..." : `${stats.dropCount}`}</span>
                        </div>
                     </div>
                     <div className="stat-card">
                        <div className={`stat-indicator up ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Subieron</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? "..." : `${stats.upCount}`}</span>
                        </div>
                     </div>
                      <div className="stat-card">
                        <div className={`stat-indicator savings ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Ahorro detectado</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? "..." : `$${stats.totalSavings.toFixed(2)}`}</span>
                        </div>
                     </div>
                      <div className="stat-card">
                        <div className={`stat-indicator star ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Mejor oferta</span>
                           <span className={`stat-value small-text ${loading ? 'loading-text' : ''}`}>
                             {loading ? "..." : (stats.bestDiscount.percent > 0 ? `-${stats.bestDiscount.percent}% (${stats.bestDiscount.title.substring(0, 15)}...)` : "Sin ofertas")}
                           </span>
                        </div>
                     </div>
                  </div>
 
                  {/* === PANEL DE GESTIÓN (Input y Filtros) === */}
                  <div className="simulate-panel">
                      <div className="panel-header-row">
                          <h3>Gestión de Catálogo</h3>
                      </div>
                      <div className="control-row"> 
                          <input
                              type="text"
                              placeholder="Pega URL o busca por nombre..."
                              value={inputValue} 
                              onChange={handleInputChange} 
                          />
                          <button className="btn-primary" onClick={handleTrackProduct} disabled={refreshing || !inputValue}>
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
                              <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)}>
                                  <option value="available">Disponibles</option>
                                  <option value="all">Todos</option>
                                  <option value="out_of_stock">Agotados</option>
                                  <option value="historical_low">Mín. Histórico</option>
                                  <option value="price_drop">Ofertas</option>
                              </select>
                          </div>
                          <button className="btn-reset-filters" onClick={handleResetAll}>Limpiar</button>
                      </div>

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
                  ) : products.length === 0 ? (
                    <div className="no-results-container">
                      <h2>No encontramos coincidencias</h2>
                      <p>Intenta cambiar los filtros o añadir uno nuevo.</p>
                      <button className="clear-search-btn" onClick={handleResetAll}>Restablecer</button>
                    </div>
                  ) : (
                    <div className="product-grid">
                      {products.map((p, index) => {
                        // Lógica de visualización segura
                        const isAgotado = p.status === "out_of_stock";
                        const isLowHistorical = p.alert_type === "low_historical";      
                        const isNew = p.status === "new";  

                        return (
                          <Link key={p.id || index} to={`/producto/${p.id}`} className={`product-card ${isAgotado ? 'card-disabled' : ''}`}>
                            <div className={`store-header ${p.url.includes("mercadolibre") ? "store-ml" : "store-default"}`}>
                              {p.url.includes("mercadolibre") ? "Mercado Libre" : "Tienda"}
                            </div>

                            <div className="image-container">
                               <img src={p.image} alt={p.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400?text=No+Img"; }} />
                               {isAgotado && <div className="alert-badge stock-badge">AGOTADO</div>}
                               {isLowHistorical && <div className="alert-badge low_historical">MÍNIMO HISTÓRICO</div>}
                               {isNew && <div className="alert-badge new-badge">NUEVO</div>}
                            </div>

                            <h3 className="product-title">{highlightText(p.title, urlQuery)}</h3>
                            
                            <div className="price-section">
                                {!isAgotado && p.previous_price && parsePrice(p.previous_price) > parsePrice(p.price) && (
                                  <span className="previous-price">{p.previous_price}</span>
                                )}
                                <span className="current-price">
                                  {isAgotado ? "No disponible" : p.price}
                                </span>
                            </div>
                            
                            {/* Etiquetas de cambio de precio */}
                            {!isAgotado && (
                                <div className="status-row">
                                {p.status === "down" && (
                                    <span className="percentage-tag down">
                                    ↓ {p.change_percentage?.replace(/[()%-]/g, '') || "0"}%
                                    </span>
                                )}
                                {p.status === "up" && (
                                    <span className="percentage-tag up">
                                    ↑ {p.change_percentage?.replace(/[()%-]/g, '') || "0"}%
                                    </span>
                                )}
                                {(["equal", "same", "stable"].includes(p.status) || (!p.status && !isNew)) && 
                                    <span className="status-stable">Sin cambios</span>
                                }
                                </div>
                            )}

                            <div className="card-action-button">{isAgotado ? "Consultar" : "Ver producto"}</div>
                            <p className="timestamp">{p.timestamp ? new Date(p.timestamp).toLocaleString() : ""}</p>
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
          {chartProductTitle && <PriceChartModal productTitle={chartProductTitle} onClose={() => setChartProductTitle(null)} apiBase={API_BASE} isDarkMode={isDarkMode} />}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;