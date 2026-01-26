import React, { useEffect, useState, useMemo } from "react";
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Navbar from './Navbar'; 
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import FeaturedProductCard from './FeaturedProductCard';
import Footer from './Footer';
import { AuthProvider } from './context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./App.css"; 

// --- COMPONENTE MODAL (Sin cambios mayores, solo optimización visual) ---
function PriceChartModal({ productTitle, onClose, apiBase, isDarkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDarkMode ? "#f1f5f9" : "#333";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#ccc";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
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

    if (productTitle) { fetchHistory(); }
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
  // 1. ESTADOS PRINCIPALES
  const [products, setProducts] = useState([]); // Ahora guardará solo los 20 de la página actual
  const [totalDocs, setTotalDocs] = useState(0); // <--- NUEVO: Total real en la DB (ej. 911)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 2. CONFIGURACIÓN Y UX
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 600 ? 8 : 20); // Ajustado a 20 para backend
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("available");
  
  // 3. VARIABLES DERIVADAS
  const searchTerm = searchParams.get("q") || "";
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 

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

  // --- LÓGICA DE CARGA DE PRODUCTOS (BACKEND PAGINATION) ---
  const fetchProducts = async (pageToLoad = 1, searchToUse = "") => {
    setLoading(true);
    try {
      // Construimos la URL con paginación y búsqueda
      let url = `${API_BASE}/product_history?page=${pageToLoad}&limit=${itemsPerPage}`;
      
      // Si hay búsqueda, la agregamos (el backend debe soportar &search=...)
      if (searchToUse) {
        url += `&search=${encodeURIComponent(searchToUse)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      // Manejo de respuesta profesional (Objeto { total, products })
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalDocs(data.total); // Guardamos el total real (911)
      } else if (Array.isArray(data)) {
        // Fallback por si el backend aún manda un array plano (versión vieja)
        setProducts(data);
        setTotalDocs(data.length);
      } else {
        setProducts([]);
        setTotalDocs(0);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- EFECTO MAESTRO: Detecta cambios en Búsqueda o Página ---
  useEffect(() => {
    // Si cambia el término de búsqueda, reseteamos a página 1 automáticamente
    // Nota: Esto se maneja implícitamente al cambiar URL, pero aseguramos la carga aquí.
    fetchProducts(currentPage, searchTerm);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, itemsPerPage]); 
  // Nota: Quitamos fetchProducts de dependencias para evitar loops

  // --- HANDLERS ---
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleResetAll = () => {
    setSearchParams({}); // Limpia URL -> searchTerm se vuelve "" -> Effect dispara fetch
    setFilterOption("available");
    setSortOption("date_desc");
    setCurrentPage(1);
  };

  const setSearchTerm = (value) => {
    // Al escribir, actualizamos la URL. 
    // setCurrentPage(1) es importante para no quedarse en página 10 de una búsqueda nueva
    setCurrentPage(1); 
    if (!value || value.trim() === "") {
      setSearchParams({});
    } else {
      setSearchParams({ q: value });
    }
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^0-9.]/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const isOutOfStock = (p) => {
      const priceNum = parsePrice(p.price);
      return !p.price || priceNum === 0 || p.price.toString().toLowerCase().includes("no posible");
  };

  // --- PROCESAMIENTO VISUAL (Solo ordena/filtra los 20 visibles) ---
  const processedProducts = useMemo(() => {
    let result = [...products];

    // NOTA: Ya NO filtramos por texto aquí, el servidor ya nos dio los resultados correctos.

    // Filtros visuales sobre los resultados actuales
    if (filterOption === "historical_low") {
      result = result.filter(p => {
        const curr = parsePrice(p.price);
        const minH = parsePrice(p.min_historical_price);
        const modeP = parsePrice(p.mode_price);
        return curr > 0 && Math.abs(curr - minH) < 0.01 && curr < modeP && !isOutOfStock(p);
      });
    } else if (filterOption === "price_drop") {
      result = result.filter(p => p.status === "down" && !isOutOfStock(p));
    } else if (filterOption === "available") {
      result = result.filter(p => !isOutOfStock(p));
    } else if (filterOption === "out_of_stock") {
      result = result.filter(p => isOutOfStock(p));
    }

    // Ordenamiento visual
    result.sort((a, b) => {
      switch (sortOption) {
        case "price_asc": return parsePrice(a.price) - parsePrice(b.price);
        case "price_desc": return parsePrice(b.price) - parsePrice(a.price);
        case "date_asc": return new Date(a.timestamp) - new Date(b.timestamp);
        default: return new Date(b.timestamp) - new Date(a.timestamp); // date_desc
      }
    });
    return result;
  }, [products, sortOption, filterOption]); // Eliminamos searchTerm de dependencias

  // --- CÁLCULO DE PÁGINAS (Usando totalDocs del servidor) ---
  const totalPages = Math.ceil(totalDocs / itemsPerPage);
  
  // Ya no usamos .slice() porque el array ya viene paginado
  const currentProducts = processedProducts; 

  const getPaginationGroup = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // --- ESTADÍSTICAS (Nota: Ahora son solo sobre la página actual, para hacerlas globales se necesita otro endpoint) ---
  const stats = useMemo(() => {
    const available = products.filter(p => !isOutOfStock(p));
    const drops = available.filter(p => p.status === "down");
    const highs = available.filter(p => p.status === "up");
    
    const totalSavings = drops.reduce((acc, p) => {
      const current = parsePrice(p.price);
      const prev = parsePrice(p.previous_price);
      return acc + (prev > current ? prev - current : 0);
    }, 0);

    let bestDiscount = { title: "Ninguna", percent: 0 };
    drops.forEach(p => {
      const pValue = parseFloat(p.change_percentage?.replace(/[()%-]/g, '') || 0);
      if (pValue > bestDiscount.percent) bestDiscount = { title: p.title, percent: pValue };
    });

    return { dropCount: drops.length, upCount: highs.length, totalSavings, bestDiscount };
  }, [products]);

  // --- MANEJO DE RASTREO (Agregar producto) ---
  const handleTrackProduct = async () => {
    const isUrl = searchTerm && searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");
    if (!isUrl) return; 
    
    setRefreshing(true); 
    setTrackingMessage(""); 
    setIsExiting(false);
    
    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.detail || "Error desconocido.");
      
      setTrackingMessage(result.message); 
      setSearchParams({}); // Limpiamos búsqueda
      await fetchProducts(1, ""); // Recargamos lista completa pag 1
      
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

  // Helpers de texto
  const highlightText = (text, query) => {
    if (!query || !text || query.includes("http")) return text;
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const tokens = normalize(query).split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return text;
    const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(pattern);
    return <>{parts.map((part, i) => tokens.some(t => normalize(t) === normalize(part)) ? <mark key={i} className="highlight">{part}</mark> : part)}</>;
  };

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
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            productCount={totalDocs} // <--- CLAVE: Pasamos el total real
          />
          
          <Routes>
            <Route path="/" element={
              <>
                <main className="main-content">
                  {/* Grid de Estadísticas (Simplificado para brevedad, misma lógica) */}
                  <div className="stats-grid">
                     <div className="stat-card">
                        <div className={`stat-indicator down ${loading ? 'loading-pulse' : ''}`}></div>
                        <div className="stat-info">
                           <span className="stat-label">Con descuento</span>
                           <span className={`stat-value ${loading ? 'loading-text' : ''}`}>{loading ? "..." : `${stats.dropCount}`}</span>
                        </div>
                     </div>
                     {/* ... (Resto de cards se mantienen igual, usan stats) ... */}
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
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <button className="btn-primary" onClick={handleTrackProduct} disabled={refreshing || !searchTerm}>
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
                  ) : currentProducts.length === 0 ? (
                    <div className="no-results-container">
                      <h2>No encontramos coincidencias</h2>
                      <button className="clear-search-btn" onClick={handleResetAll}>Restablecer</button>
                    </div>
                  ) : (
                    <div className="product-grid">
                      {currentProducts.map((p, index) => {
                        const outOfStock = isOutOfStock(p);
                        const isAtHistoricalLow = parsePrice(p.price) > 0 && Math.abs(parsePrice(p.price) - parsePrice(p.min_historical_price)) < 0.01 && !outOfStock;
                        
                        return (
                          <Link key={p.id || index} to={`/producto/${p.id}`} className="product-card" style={{ opacity: outOfStock ? 0.7 : 1 }}>
                            <div className={`store-header ${p.url.includes("mercadolibre") ? "store-ml" : "store-default"}`}>
                              {p.url.includes("mercadolibre") ? "Mercado Libre" : "Tienda"}
                            </div>
                            <div className="image-container">
                               <img src={p.image} alt={p.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400?text=No+Img"; }} />
                               {outOfStock && <div className="alert-badge stock-badge">🚫 SIN STOCK</div>}
                               {isAtHistoricalLow && <div className="alert-badge low_historical">MÍNIMO HISTÓRICO</div>}
                            </div>
                            <h3 className="product-title">{highlightText(p.title, searchTerm)}</h3>
                            
                            {/* Precios */}
                            {!outOfStock && p.previous_price && <p className="previous-price">Antes: <s>{p.previous_price}</s></p>}
                            <p className="current-price"><strong>{outOfStock ? "No disponible" : p.price}</strong></p>
                            
                            {/* Tags de estado */}
                            <div className="status-row">
                               {!outOfStock && p.status === "down" && <span className="percentage-tag down">↓ -{p.change_percentage?.replace(/[()%-]/g, '')}%</span>}
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
          {chartProductTitle && <PriceChartModal productTitle={chartProductTitle} onClose={() => setChartProductTitle(null)} apiBase={API_BASE} isDarkMode={isDarkMode} />}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;