import React, { useEffect, useState, useMemo } from "react"; 
// Importar componentes de Recharts
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

// === Componente Modal para la Gráfica (INTACTO) ===
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
             console.log(`Historial no encontrado. Clave: ${safeKeyTitle}.`);
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
        <h3 style={{ color: '#333' }}>Historial de Precio: {productTitle}</h3>
        {loading ? (
          <p style={{ color: '#333' }}>Cargando historial...</p>
        ) : history.length > 1 ? ( 
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} /> 
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: '#333' }}>
            No hay suficiente historial para mostrar una gráfica (se necesitan al menos 2 precios distintos).
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

  // 🟢 NUEVO ESTADO: Paginación
  const [visibleCount, setVisibleCount] = useState(20);

  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  const fetchProducts = async () => {
    setLoading(true); 
    try {
      const res = await fetch(`${API_BASE}/product_history`); 
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]); 
      }
    } catch (err) {
      console.error("Error:", err);
      setProducts([]); 
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };
  
  useEffect(() => { fetchProducts(); }, []); 

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ""));
  };

  const isOutOfStock = (p) => {
      const priceNum = parsePrice(p.price);
      return !p.price || priceNum === 0 || p.price.toString().toLowerCase().includes("no posible");
  };

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

    // 1. Filtros
    if (searchTerm && !searchTerm.includes("http")) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowerSearch));
    }

    // 2. Estado
    if (filterOption === "historical_low") {
      result = result.filter(p => p.alert_type === "low_historical" && !isOutOfStock(p));
    } else if (filterOption === "price_drop") {
      result = result.filter(p => p.status === "down" && !isOutOfStock(p));
    } else if (filterOption === "available") {
      result = result.filter(p => !isOutOfStock(p));
    } else if (filterOption === "out_of_stock") {
      result = result.filter(p => isOutOfStock(p));
    }

    // 3. Ordenamiento
    result.sort((a, b) => {
      if (filterOption === "all") {
          const aStock = isOutOfStock(a);
          const bStock = isOutOfStock(b);
          if (aStock && !bStock) return 1;
          if (!aStock && bStock) return -1;
      }
      switch (sortOption) {
        case "price_asc": return parsePrice(a.price) - parsePrice(b.price);
        case "price_desc": return parsePrice(b.price) - parsePrice(a.price);
        case "date_asc": return new Date(a.timestamp) - new Date(b.timestamp);
        case "date_desc": default: return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    return result;
  }, [products, searchTerm, sortOption, filterOption]);

  // 🟢 EFECTO: Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, filterOption, sortOption]);

  const getPriceColor = (price) => {
    const value = parsePrice(price);
    if (value === 0) return "#e9ecef"; 
    if (value < 10000) return "#d4edda";
    if (value < 20000) return "#fff3cd";
    return "#f8d7da";
  };

  const getStatusEmoji = (status, product) => {
    if (isOutOfStock(product)) return "🚫 Agotado";
    if (status === "down") return "🟢 ↓ Bajó";
    if (status === "up") return "🔴 ↑ Subió";
    if (status === "same") return "🟡 → Igual";
    return "🆕 Nuevo";
  };

  // 🟢 FUNCIÓN PARA EL BOTÓN VER MÁS
  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 20);
  };

  // 🟢 DEFINIR PRODUCTOS VISIBLES
  const visibleProducts = processedProducts.slice(0, visibleCount);

  if (loading) return <p>Cargando productos...</p>;
  
  return (
    <div className="App">
      <h1>🛒 Price Tracker (ML)</h1>

      <div className="simulate-panel">
          <h3>Añadir Nuevo Producto / Buscar en Catálogo</h3>
          
          <div className="control-row"> 
              <input
                  type="text"
                  placeholder="Pega URL de ML o escribe para buscar aquí"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={handleTrackProduct} disabled={refreshing || !searchTerm}>
                  {refreshing ? "Rastreando..." : "Rastrear / Buscar"}
              </button>
              <button onClick={() => { setSearchTerm(""); fetchProducts(); }} disabled={refreshing}>
                  {refreshing ? "Actualizando..." : "🔄 Actualizar Lista"}
              </button>
          </div>

          <div className="filter-row">
              <span className="filter-label">Filtros y Ordenamiento:</span> 
              
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{cursor: "pointer"}}>
                  <option value="date_desc">📅 Fecha: Reciente</option>
                  <option value="date_asc">📅 Fecha: Antiguo</option>
                  <option value="price_asc">💰 Precio: Menor a Mayor</option>
                  <option value="price_desc">💰 Precio: Mayor a Menor</option>
              </select>

              <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} style={{cursor: "pointer"}}>
                  <option value="available">✅ Solo Disponibles (Recomendado)</option>
                  <option value="all">👁️ Ver Todos</option>
                  <option value="out_of_stock">🚫 Ver Solo Agotados</option>
                  <option value="historical_low">🏆 Mínimo Histórico</option>
                  <option value="price_drop">📉 Solo Ofertas (Bajó)</option>
              </select>
          </div>
          
          {trackingMessage && (
            <p className="tracking-message" style={{width: "100%"}}>{trackingMessage}</p>
          )}
      </div>
      
      <div className="product-grid">
        {visibleProducts.length === 0 ? (
            <p className="no-products-message">
                No se encontraron productos con estos criterios.
            </p>
        ) : (
            // 🟢 USAMOS visibleProducts en lugar de processedProducts
            visibleProducts.map((p, index) => {
                const outOfStock = isOutOfStock(p);

                return (
                <div
                    key={index}
                    className="product-card"
                    style={{ 
                        backgroundColor: outOfStock ? "#f1f1f1" : getPriceColor(p.price),
                        opacity: outOfStock ? 0.7 : 1, 
                        filter: outOfStock ? "grayscale(100%)" : "none"
                    }}
                    onClick={() => setChartProductTitle(p.title)} 
                >
                    {outOfStock && (
                        <div className="alert-badge" style={{backgroundColor: "#6c757d"}}>
                            🚫 SIN STOCK
                        </div>
                    )}

                    {!outOfStock && p.alert_type === "low_historical" && (
                    <div className="alert-badge low_historical">
                        ¡MÍNIMO HISTÓRICO! 📉
                    </div>
                    )}
                    
                    <img src={p.image} alt={p.title} />
                    <h3 style={{ textDecoration: outOfStock ? "line-through" : "none" }}>
                        {p.title}
                    </h3>

                    {!outOfStock && p.status !== "new" && p.previous_price && (
                    <p className="previous-price">
                        Precio Anterior: <s>{p.previous_price}</s>
                    </p>
                    )}

                    <p className="current-price">
                        <strong>{outOfStock ? "No disponible" : p.price}</strong>
                    </p>
                    
                    <p>
                        {getStatusEmoji(p.status, p)} 
                        {!outOfStock && (p.status === "up" || p.status === "down") && (
                            <span className="change-text"> ({p.change_percentage})</span>
                        )}
                    </p>
                    
                    {!outOfStock && p.mode_price && (
                        <div className="context-box">
                            <p><strong>Frecuente:</strong> {p.mode_price}</p>
                            <p><strong>Mín. Registrado:</strong> {p.min_historical_price}</p>
                        </div>
                    )}
                    
                    <a href={p.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                       {outOfStock ? "Ver en ML (Revisar)" : "Ver producto"}
                    </a>
                    <p className="timestamp">
                    {new Date(p.timestamp).toLocaleString()}
                    </p> 
                </div>
            )})
        )}
      </div>

      {/* 🟢 BOTÓN VER MÁS: Se muestra solo si hay más elementos que mostrar */}
      {processedProducts.length > visibleCount && (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <button 
            onClick={handleShowMore}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px"
            }}
          >
            ⬇️ Ver más productos ({processedProducts.length - visibleCount} restantes)
          </button>
        </div>
      )}
      
      {chartProductTitle && (
        <PriceChartModal
          productTitle={chartProductTitle}
          onClose={() => setChartProductTitle(null)}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
}

export default App;
