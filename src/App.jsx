import React, { useEffect, useState, useMemo } from "react"; 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css"; 

// === Componente Modal para la Gráfica ===
function PriceChartModal({ productTitle, onClose, apiBase, isDarkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Define los colores dinámicos
  const textColor = isDarkMode ? "#f1f5f9" : "#333";
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "#ccc";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const safeKeyTitle = productTitle
            .trim()
            .replace(/\s+/g, ' ') 
            .replace(/[/\+]/g, '_'); 

        const url = `${apiBase}/history/${encodeURIComponent(safeKeyTitle)}`;
        const res = await fetch(url);
        
        if (res.status === 404) {
             setHistory([]);
             return;
        }

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
            .filter(item => item !== null); 
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
        
        {/* 3. Título dinámico y con margen superior */}
        <h3 style={{ color: textColor, marginTop: '20px', marginBottom: '20px' }}>
          Historial de Precio: {productTitle}
        </h3>

        {loading ? (
          <p style={{ color: textColor }}>Cargando historial...</p>
        ) : history.length > 1 ? ( 
          <div style={{ width: "100%", height: 300, paddingRight: '20px' }}>
            <ResponsiveContainer>
              <LineChart data={history}>
                {/* 4. Colores dinámicos en los componentes de la gráfica */}
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: textColor, fontSize: 12 }} 
                />
                <YAxis 
                  domain={["auto", "auto"]} 
                  tick={{ fill: textColor, fontSize: 12 }} 
                /> 
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#1e293b" : "#fff", 
                    color: textColor,
                    border: `1px solid ${gridColor}`
                  }}
                  itemStyle={{ color: isDarkMode ? "#3b82f6" : "#8884d8" }}
                  formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isDarkMode ? "#3b82f6" : "#8884d8"} 
                  dot={false} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: textColor }}>
            No hay suficiente historial para mostrar una gráfica.
          </p>
        )}
      </div>
    </div>
  );
}

// === Componente Principal ===
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [trackingMessage, setTrackingMessage] = useState(""); 
  const [chartProductTitle, setChartProductTitle] = useState(null);
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("available"); 
  
  // Modo Oscuro: Inicia en true
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  const fetchProducts = async () => {
    setLoading(true); 
    try {
      const res = await fetch(`${API_BASE}/product_history`); 
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };
  
  useEffect(() => { fetchProducts(); }, []); 

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^0-9.]/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const isOutOfStock = (p) => {
      const priceNum = parsePrice(p.price);
      return !p.price || priceNum === 0 || p.price.toString().toLowerCase().includes("no posible");
  };

  // === LÓGICA DE ESTADÍSTICAS ===
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
      if (pValue > bestDiscount.percent) {
        bestDiscount = { title: p.title, percent: pValue };
      }
    });

    return { dropCount: drops.length, upCount: highs.length, totalSavings, bestDiscount };
  }, [products]);

  const handleTrackProduct = async () => {
    const isUrl = searchTerm && searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");
    if (!isUrl) return; 
    setRefreshing(true); 
    setTrackingMessage("Rastreando... esto puede tardar hasta 40 segundos.");
    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Error desconocido.");
      setTrackingMessage(result.message); 
      setSearchTerm("");
      await fetchProducts(); 
    } catch (err) {
      setTrackingMessage(`Error: ${err.message}`); 
    } finally {
      setRefreshing(false); 
    }
  };

  // === LÓGICA DE FILTRADO Y ORDENAMIENTO ===
  const processedProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm && !searchTerm.includes("http")) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowerSearch));
    }
    if (filterOption === "historical_low") {
      result = result.filter(p => p.alert_type === "low_historical" && p.status === "down" && !isOutOfStock(p));
    } else if (filterOption === "price_drop") {
      result = result.filter(p => p.status === "down" && !isOutOfStock(p));
    } else if (filterOption === "available") {
      result = result.filter(p => !isOutOfStock(p));
    } else if (filterOption === "out_of_stock") {
      result = result.filter(p => isOutOfStock(p));
    }
    result.sort((a, b) => {
      switch (sortOption) {
        case "price_asc": return parsePrice(a.price) - parsePrice(b.price);
        case "price_desc": return parsePrice(b.price) - parsePrice(a.price);
        case "date_asc": return new Date(a.timestamp) - new Date(b.timestamp);
        default: return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });
    return result;
  }, [products, searchTerm, sortOption, filterOption]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterOption, sortOption]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const currentProducts = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const getPaginationGroup = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className={isDarkMode ? "dark-mode" : "light-mode"}>
      <div className="App">
        {/* === NAVBAR === */}
        <nav className="navbar">
          <div className="navbar-content">
            <span className="logo">🛒 Price Tracker (ML)</span>
            
            <div className="nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* SWITCH ELEGANTE */}
              <div className="theme-switch-wrapper">
                <label className="theme-switch">
                  <input 
                    type="checkbox" 
                    checked={isDarkMode} 
                    onChange={() => setIsDarkMode(!isDarkMode)} 
                  />
                  <div className="slider"></div>
                </label>
              </div>
              
              <span className="product-count">
                {processedProducts.length} Productos
              </span>
            </div>
          </div>
        </nav>

        {/* === CONTENEDOR PRINCIPAL === */}
        <main className="main-content">
          
         {/* === PANEL DE ESTADÍSTICAS === */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-indicator down"></div>
            <div className="stat-info">
              <span className="stat-label">Productos en descuento</span>
              <span className="stat-value">{stats.dropCount} Precios bajos</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-indicator savings"></div>
            <div className="stat-info">
              <span className="stat-label">Ahorro Proyectado</span>
              <span className="stat-value">${stats.totalSavings.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div className="stat-card highlight" onClick={() => stats.bestDiscount.percent > 0 && setSearchTerm(stats.bestDiscount.title)}>
            <div className="stat-info">
              <span className="stat-label">Producto con mayor descuento</span>
              <span className="stat-value">-{stats.bestDiscount.percent}% Descuento</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-indicator up"></div>
            <div className="stat-info">
              <span className="stat-label">Productos con incremento de precio</span>
              <span className="stat-value">{stats.upCount} Precios a la alza</span>
            </div>
          </div>
        </div>

        <div className="simulate-panel">
            <h3>Gestión de Catálogo</h3>
            <div className="control-row"> 
                <input
                    type="text"
                    placeholder="Pega URL de Mercado Libre o busca por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn-primary" onClick={handleTrackProduct} disabled={refreshing || !searchTerm}>
                    {refreshing ? "Procesando..." : "Rastrear Producto"}
                </button>
                <button className="btn-secondary" onClick={() => { setSearchTerm(""); fetchProducts(); }} disabled={refreshing}>
                    {refreshing ? "Actualizando..." : "Actualizar Lista"}
                </button>
            </div>

            <div className="filter-row">
                <div className="select-wrapper">
                    <label>Ordenar por</label>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                        <option value="date_desc">Más recientes</option>
                        <option value="date_asc">Más antiguos</option>
                        <option value="price_asc">Precio: Menor a Mayor</option>
                        <option value="price_desc">Precio: Mayor a Menor</option>
                    </select>
                </div>

                <div className="select-wrapper">
                    <label>Filtrar estado</label>
                    <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)}>
                        <option value="available">Solo Disponibles</option>
                        <option value="all">Ver Todos</option>
                        <option value="out_of_stock">Solo Agotados</option>
                        <option value="historical_low">Mínimos Históricos</option>
                        <option value="price_drop">Solo Ofertas</option>
                    </select>
                </div>
            </div>
            {trackingMessage && <p className="tracking-message">{trackingMessage}</p>}
        </div>
          
          {/* Paginación Superior */}
          {totalPages > 1 && !loading && (
             <div className="pagination-container">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-arrow">‹</button>
                {getPaginationGroup().map((item, i) => (
                    <button key={i} onClick={() => typeof item === 'number' && handlePageChange(item)} className={`pagination-number ${currentPage === item ? 'active' : ''} ${item === '...' ? 'dots' : ''}`} disabled={item === '...'}>{item}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-arrow">›</button>
             </div>
          )}

          <div className="product-grid">
            {loading ? (
              Array.from({ length: 15 }).map((_, index) => (
                <div key={index} className="product-card skeleton-card">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ))
            ) : currentProducts.length === 0 ? (
              <p className="no-products-message">No se encontraron productos.</p>
            ) : (
              currentProducts.map((p, index) => {
                const outOfStock = isOutOfStock(p);
                const isML = p.url.includes("mercadolibre");
                const isAmazon = p.url.includes("amazon");
                const storeName = isML ? "Mercado Libre" : isAmazon ? "Amazon" : "Tienda";
                const storeClass = isML ? "store-ml" : isAmazon ? "store-amazon" : "store-default";
                const isRealLowHistorical = p.alert_type === "low_historical" && p.status === "down" && !outOfStock;

                const renderPreviousPrice = () => {
                  if (!outOfStock && p.status !== "new" && p.previous_price) {
                    return <p className="previous-price">Antes: <s>{p.previous_price}</s></p>;
                  }
                  return <div style={{ height: '18px', margin: '0' }}></div>;
                };

                return (
                  <div key={index} className="product-card" onClick={() => setChartProductTitle(p.title)}
                      style={{ opacity: outOfStock ? 0.7 : 1, filter: outOfStock ? "grayscale(100%)" : "none" }}>
                      <div className={`store-header ${storeClass}`}>{storeName}</div>
                      <div className="image-container">
                        <img src={p.image} alt={p.title} />
                        {outOfStock && <div className="alert-badge stock-badge">🚫 SIN STOCK</div>}
                        {isRealLowHistorical && <div className="alert-badge low_historical">MÍNIMO HISTÓRICO</div>}
                      </div>
                      <h3>{p.title}</h3>
                      {renderPreviousPrice()}
                      <p className="current-price"><strong>{outOfStock ? "No disponible" : p.price}</strong></p>
                      <div className="status-row">
                        {!outOfStock && (
                          <>
                            {p.status === "down" && (
                              <span className="percentage-tag down">↓ -{p.change_percentage?.replace(/[()%-]/g, '')}%</span>
                            )}
                            {p.status === "up" && (
                              <span className="percentage-tag up">↑ +{p.change_percentage?.replace(/[()%-]/g, '')}%</span>
                            )}
                            {(p.status === "equal" || p.status === "same" || p.status === "stable" || !p.status || p.status === "") && p.status !== "new" && (
                              <span className="status-stable">Sin cambios</span>
                            )}
                            {p.status === "new" && <span className="status-new">Recién añadido</span>}
                          </>
                        )}
                      </div>
                      {!outOfStock && p.mode_price && (
                          <div className="context-box">
                            <p><strong>Frecuente:</strong> {p.mode_price}</p>
                            <p><strong>Mín. Registrado:</strong> {p.min_historical_price}</p>
                          </div>
                      )}
                      <a href={p.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                         {outOfStock ? "Revisar disponibilidad" : "Ver producto"}
                      </a>
                      <p className="timestamp">{new Date(p.timestamp).toLocaleString()}</p> 
                  </div>
                )
              })
            )}
          </div>

          {/* Paginación Inferior */}
          {totalPages > 1 && !loading && (
             <div className="pagination-container" style={{marginTop: '30px', marginBottom: '50px'}}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-arrow">‹</button>
                {getPaginationGroup().map((item, i) => (
                    <button key={i} onClick={() => typeof item === 'number' && handlePageChange(item)} className={`pagination-number ${currentPage === item ? 'active' : ''} ${item === '...' ? 'dots' : ''}`} disabled={item === '...'}>{item}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-arrow">›</button>
             </div>
          )}
        </main>

        {chartProductTitle && (
          <PriceChartModal
            productTitle={chartProductTitle}
            onClose={() => setChartProductTitle(null)}
            apiBase={API_BASE}
            isDarkMode={isDarkMode} // <--- ESTA LÍNEA ES CLAVE
          />
        )}
      </div> {/* Cierre App */}
    </div> /* Cierre Modo Dinámico */
  );
}

export default App;