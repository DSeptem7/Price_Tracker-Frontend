import React, { useEffect, useState, useMemo, useRef } from "react";
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar'; // <--- IMPORTANTE: Importamos el componente
import ScrollToTop from "./ScrollToTop";
import ProductDetail from './ProductDetail';
import FeaturedProductCard from './FeaturedProductCard';
import Footer from './Footer';
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
          <div style={{ width: "100%", height: 300, paddingRight: '20px', outline: 'none' }}>
            <ResponsiveContainer style={{ outline: 'none' }}>
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
                  offset={20}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.8)", 
                    backdropFilter: 'blur(4px)',
                    color: textColor,
                    border: `1px solid ${gridColor}`,
                    borderRadius: '8px'
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
  const [loadingText, setLoadingText] = useState("Iniciando rastreo...");
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  // Modo Oscuro: Intenta leer de LocalStorage, si no existe usa true por defecto
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("isDarkMode");
      // Importante: LocalStorage guarda strings, comparamos contra "false"
      return savedTheme !== null ? savedTheme === "true" : true;
    } catch (error) {
      return true; // Si hay error, regresamos al modo oscuro por defecto
    }
  });

  // Efecto para persistir el modo oscuro y aplicarlo al DOM
  useEffect(() => {
    // Guardamos la preferencia
    localStorage.setItem("isDarkMode", isDarkMode);
    
    // Aplicamos o quitamos la clase al body
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

// Lista de mensajes para mantener al usuario entretenido
const loadingMessages = [
  "Conectando...",
  "Extrayendo información del producto...",
  "Analizando historial de precios...",
  "Verificando disponibilidad de stock...",
  "Guardando datos en la nube...",
  "¡Ya casi terminamos!"
];

// Efecto para rotar los mensajes cuando 'refreshing' (o loading) es true
useEffect(() => {
  let interval;
  if (refreshing) { // Ojo: asegúrate de usar la variable que activa tu carga (refreshing o loading)
    let i = 0;
    setLoadingText(loadingMessages[0]); // Mensaje inicial
    interval = setInterval(() => {
      i = (i + 1) % loadingMessages.length; // Ciclo infinito
      setLoadingText(loadingMessages[i]);
    }, 3500); // Cambia cada 3.5 segundos
  }
  return () => clearInterval(interval);
}, [refreshing]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth < 600 ? 8 : 15);
  
  // Opcional: Ajustar si el usuario cambia el tamaño de la ventana (resizing)
useEffect(() => {
  const handleResize = () => {
    setItemsPerPage(window.innerWidth < 600 ? 8 : 15);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

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
    setTrackingMessage(""); 
    setIsExiting(false); // Aseguramos que no esté en modo salida
    
    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.detail || "Error desconocido.");
      
      setTrackingMessage(result.message); 
      setSearchTerm("");
      await fetchProducts(); 
      
      // INICIO DE LA DESAPARICIÓN SUAVE
      setTimeout(() => {
        setIsExiting(true); // Activa la clase CSS 'fade-out-message'
        
        // Esperamos a que termine la animación (600ms) para limpiar el estado
        setTimeout(() => {
          setTrackingMessage("");
          setIsExiting(false);
        }, 600); 
      }, 6000); // Se queda visible 6 segundos

    } catch (err) {
      setTrackingMessage(`Error: ${err.message}`); 
      // Los errores no los animamos para que el usuario los lea bien
    } finally {
      setRefreshing(false); 
    }
};

 // === LÓGICA DE FILTRADO Y ORDENAMIENTO ===
const processedProducts = useMemo(() => {
  let result = [...products];

  if (searchTerm && !searchTerm.includes("http")) {
    const normalizeText = (str) => {
      if (!str) return "";
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };
// 2. Limpiamos lo que escribió el usuario y la convertimos en TOKENS
const cleanSearch = normalizeText(searchTerm);
const searchTokens = cleanSearch.split(/\s+/).filter(token => token.length > 0);

// 3. Filtramos limpiando también el título del producto
result = result.filter(p => {
  const titleNormalized = normalizeText(p.title);
  // Solo incluimos el producto si cada palabra de la búsqueda existe en el título
  return searchTokens.every(token => titleNormalized.includes(token));
});

// --- CAMBIO FIN ---
}

  if (filterOption === "historical_low") {
    // NUEVA LÓGICA PERMANENTE PARA EL FILTRO
    result = result.filter(p => {
      const curr = parsePrice(p.price);
      const minH = parsePrice(p.min_historical_price);
      const modeP = parsePrice(p.mode_price);
      const outOfStock = isOutOfStock(p);

      // Solo pasa el filtro si:
      // 1. El precio actual es el mínimo (curr === minH)
      // 2. Realmente es una oferta (curr < modeP)
      // 3. No está agotado
      return curr > 0 && Math.abs(curr - minH) < 0.01 && curr < modeP && !outOfStock;
    });
  } else if (filterOption === "price_drop") {
    // Aquí mantenemos status "down" porque "Ofertas" sí suele ser algo temporal del último scraping
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

        {/* 1. Insertamos el componente aquí */}
        <ScrollToTop />

        {/* === NAVBAR COMPONENTE === */}
        <Navbar 
        products={products}  // <--- AGREGAR ESTA LÍNEA (pasamos todos los datos)
        searchTerm={searchTerm} // Esto se queda, pero ya no se usa para el input directo
        setSearchTerm={setSearchTerm}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        productCount={processedProducts.length} 
      />

        {/* === INICIO DE RUTAS === */}
        <Routes>

          {/* RUTA 1: RUTA PRINCIPAL (HOME) */}
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
              <span className={`stat-value ${loading ? 'loading-text' : ''}`}>
              {loading ? "Cargando..." : `${stats.dropCount} Productos`}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
          <div className={`stat-indicator savings ${loading ? 'loading-pulse' : ''}`}></div>
            <div className="stat-info">
              <span className="stat-label">Ahorro en ofertas</span>
              <span className={`stat-value ${loading ? 'loading-text' : ''}`}>
              {loading ? "Cargando..." : `$${stats.totalSavings.toLocaleString('es-MX', {minimumFractionDigits: 2})}`}
              </span>
            </div>
          </div>

          <div className="stat-card highlight" onClick={() => !loading && stats.bestDiscount.percent > 0 && setSearchTerm(stats.bestDiscount.title)}
            style={{ cursor: loading ? 'default' : 'pointer' }} // Evita el cursor de mano al cargar
          >
            <div className="stat-info">
              <span className="stat-label">Producto con mayor descuento</span>
              <span className={`stat-value ${loading ? 'loading-text' : ''}`}>
              {loading ? "Cargando..." : `-${stats.bestDiscount.percent}% Descuento`}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
          <div className={`stat-indicator up ${loading ? 'loading-pulse' : ''}`}></div>
            <div className="stat-info">
              <span className="stat-label">Con incremento de precio</span>
              <span className={`stat-value ${loading ? 'loading-text' : ''}`}>
              {loading ? "Cargando..." : `${stats.upCount} Productos`}
              </span>
            </div>
          </div>
        </div>

        {/* --- PANEL DE GESTIÓN --- */}
        <div className="simulate-panel">
            <div className="panel-header-row">
                <h3>Gestión de Catálogo</h3>
                <div className="info-tooltip-wrapper">
                    <span className="info-icon">?</span>
                    <div className="tooltip-content">
                        <p><strong>Guía rápida:</strong></p>
                        <ul>
                            <li><strong>Buscar:</strong> Escribe el nombre del producto.</li>
                            <li><strong>Añadir:</strong> Pega la URL para rastrear uno nuevo.</li>
                            <li><strong>Actualizar:</strong> Ingresa la URL de un producto ya guardado.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="control-row"> 
                <input
                    type="text"
                    placeholder="Pega URL de Mercado Libre o busca por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* BOTÓN 1: RASTREAR */}
                <button 
                  className="btn-primary" 
                  onClick={handleTrackProduct} 
                  disabled={refreshing || !searchTerm}
                  style={{ minWidth: '160px' }}
                >
                    {refreshing ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span>Procesando</span>
                        <span className="dot-flashing"></span>
                        <span className="dot-flashing"></span>
                        <span className="dot-flashing"></span>
                      </div>
                    ) : (
                      "Rastrear Producto"
                    )}
                </button>

                {/* BOTÓN 2: ACTUALIZAR */}
                <button 
                  className="btn-secondary" 
                  onClick={() => { setSearchTerm(""); fetchProducts(); }} 
                  disabled={refreshing}
                >
                    {refreshing ? "Actualizando..." : "Actualizar Lista"}
                </button>
            </div> {/* AQUÍ CIERRA EL CONTROL-ROW (DONDE ESTÁN LOS BOTONES) */}

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
            
    {/* ZONA DE MENSAJES ÚNICA: Solo aparece si está cargando O si hay un mensaje que mostrar */}
    {(refreshing || trackingMessage) && (
                      <div 
                      className={`status-message-container ${isExiting ? 'fade-out-message' : ''}`} 
                      style={{ 
                        margin: isExiting ? '0' : '15px 0 5px 0', 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' // Sincronizado con el CSS
                      }}
                    >
                        {refreshing ? (
                          <span className="status-message-text" key={loadingText}> 
                            <div className="spinner-icon"></div>
                            {loadingText}
                          </span>
                        ) : (
                          trackingMessage && (
                            <p className={`tracking-message ${trackingMessage.toLowerCase().includes("error") ? "error" : "success"}`} 
                              style={{ 
                                fontSize: '1.1rem', 
                                fontWeight: '600', 
                                margin: 0,
                                transition: 'opacity 0.4s ease' // Desvanecimiento interno
                              }}>
                              {trackingMessage}
                            </p>
                          )
                        )}
                    </div>
                    )}
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

{/* CONTADOR */}
{!loading && (
  <div style={{ marginBottom: '15px', textAlign: 'right' }}>
    <span style={{ color: 'var(--text-muted, #666)', fontWeight: '600', fontSize: '0.9rem' }}>
      {processedProducts.length} Productos encontrados
    </span>
  </div>
)}

{/* INICIO DE LÓGICA CONDICIONAL */}
{loading ? (
  <div className="product-grid">
    {Array.from({ length: itemsPerPage }).map((_, index) => (
      <div key={index} className="product-card skeleton-card">
        <div className="skeleton-img"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text short"></div>
      </div>
    ))}
  </div>
) : currentProducts.length === 0 ? (
  <p className="no-products-message">No se encontraron productos.</p>
) : currentProducts.length === 1 && searchTerm !== "" ? (
  <div className="featured-product-wrapper">
    <FeaturedProductCard 
      product={currentProducts[0]} 
      setSearchTerm={setSearchTerm} 
    />
  </div>
) : (
  /* AQUÍ LA CORRECCIÓN: Abrimos la grilla y metemos el map dentro */
  <div className="product-grid">
    {currentProducts.map((p, index) => {
      const outOfStock = isOutOfStock(p);
      const isML = p.url.includes("mercadolibre");
      const isAmazon = p.url.includes("amazon");
      const storeName = isML ? "Mercado Libre" : isAmazon ? "Amazon" : "Tienda";
      const storeClass = isML ? "store-ml" : isAmazon ? "store-amazon" : "store-default";
      const currentPriceNum = parsePrice(p.price);
      const minHistoricalNum = parsePrice(p.min_historical_price);
      const modePriceNum = parsePrice(p.mode_price);
      const isAtHistoricalLow = currentPriceNum > 0 && Math.abs(currentPriceNum - minHistoricalNum) < 0.01 && currentPriceNum < modePriceNum && !outOfStock;

      const renderPreviousPrice = () => {
        if (!outOfStock && p.status !== "new" && p.previous_price) {
          return <p className="previous-price">Antes: <s>{p.previous_price}</s></p>;
        }
        return <div style={{ height: '18px', margin: '0' }}></div>;
      };

return (
    <Link 
      key={p.id || index} 
      to={`/producto/${p.id}`} // Enlace interno al detalle
      className="product-card"
      onClick={() => {
         if (setSearchTerm) setSearchTerm(""); // Limpiamos búsqueda si es necesario
      }}
      style={{ 
        textDecoration: 'none', 
        color: 'inherit',
        opacity: outOfStock ? 0.7 : 1, 
        filter: outOfStock ? "grayscale(100%)" : "none",
        display: 'block', 
        cursor: 'pointer',
        animationDelay: `${index * 0.05}s`,
        position: 'relative' // Necesario para posicionamiento
      }}
    >
      <div className={`store-header ${storeClass}`}>{storeName}</div>
      
      <div className="image-container">
        <img src={p.image} alt={p.title} />
        {outOfStock && <div className="alert-badge stock-badge">🚫 SIN STOCK</div>}
        {isAtHistoricalLow && <div className="alert-badge low_historical">MÍNIMO HISTÓRICO</div>}
      </div>

      <h3 className="product-title">
      {highlightText(p.title, searchTerm)}
      </h3>
      
      {renderPreviousPrice()}
      
      <p className="current-price">
        <strong>{outOfStock ? "No disponible" : p.price}</strong>
      </p>

      <div className="status-row">
        {!outOfStock && (
          <>
            {p.status === "down" && <span className="percentage-tag down">↓ -{p.change_percentage?.replace(/[()%-]/g, '')}%</span>}
            {p.status === "up" && <span className="percentage-tag up">↑ +{p.change_percentage?.replace(/[()%-]/g, '')}%</span>}
            {(p.status === "equal" || p.status === "same" || p.status === "stable" || !p.status) && p.status !== "new" && <span className="status-stable">Sin cambios</span>}
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

      {/* CAMBIO IMPORTANTE: YA NO ES UN <A>, ES UN DIV ESTILIZADO */}
      <div className="card-action-button">
         {outOfStock ? "Consultar disponibilidad" : "Ver producto"}
      </div>
      
      <p className="timestamp">{new Date(p.timestamp).toLocaleString()}</p> 
    </Link> // Cerramos correctamente el Link
  );
})}
</div> // CIERRE CORRECTO DEL PRODUCT-GRID
)}

          {/* Paginación Inferior */}
          {totalPages > 1 && !loading && (
             <div className="pagination-container">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-arrow">‹</button>
                {getPaginationGroup().map((item, i) => (
                    <button key={i} onClick={() => typeof item === 'number' && handlePageChange(item)} className={`pagination-number ${currentPage === item ? 'active' : ''} ${item === '...' ? 'dots' : ''}`} disabled={item === '...'}>{item}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-arrow">›</button>
             </div>
          )}
        </main>
          {/* === AGREGA ESTAS DOS LÍNEAS AQUÍ === */}
          </>
                } />
                /* LO NUEVO (PEGAR) */
            <Route 
              path="/producto/:id" 
              element={<ProductDetail API_BASE={API_BASE} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>} 
            />

            </Routes>
            {/* === FIN DE RUTAS === */}

            {/* AQUÍ VA EL FOOTER: Fuera de Routes para que sea universal */}
            <Footer />

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

const highlightText = (text, query) => {
  if (!query || !text || query.includes("http")) return text;

  const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tokens = normalize(query).split(/\s+/).filter(t => t.length > 0);

  if (tokens.length === 0) return text;

  // Creamos el patrón para buscar los tokens
  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => 
        tokens.some(t => normalize(t) === normalize(part)) ? 
          <mark key={i} className="highlight">{part}</mark> : 
          part
      )}
    </>
  );
};

export default App;
