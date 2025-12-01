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

// === Componente Modal para la Gráfica (VERSIÓN CON MÁXIMA SANITIZACIÓN) ===
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        // 🛑 MÁXIMA SANITIZACIÓN: Creamos una clave segura sin barras, espacios dobles, o signos especiales.
        // Esto es un intento de imitar cómo el backend podría haber "limpiado" la clave para la DB.
        // Reemplazamos barras ('/') y '+' por un guion bajo ('_') para que no rompan la ruta ni la coincidencia.
        const safeKeyTitle = productTitle
            .trim()
            .replace(/\s+/g, ' ') // Quita espacios dobles
            .replace(/[/\+]/g, '_'); // Reemplaza '/' y '+' por '_'

        // Llama al endpoint /history/{product_title}
        // Usamos la clave segura para la ruta
        const url = `${apiBase}/history/${encodeURIComponent(
          safeKeyTitle
        )}`;
        
        const res = await fetch(url);
        
        if (res.status === 404) {
             setHistory([]);
             console.log(`Historial no encontrado para el producto. Clave enviada: ${safeKeyTitle}.`);
             return;
        }
        
        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          // Mapeamos la data de historial
          const formattedData = data.history
            .map((item) => {
              const priceValue = parseFloat(item.price);
              
              if (isNaN(priceValue) || priceValue <= 0) return null; 

              return {
                price: priceValue,
                date: new Date(item.timestamp).toLocaleString("es-MX", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
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

    if (productTitle) {
      fetchHistory();
    }
  }, [productTitle, apiBase]);

  return (
// ... (El JSX es idéntico a tu versión anterior)
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
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
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8884d8"
                  dot={false}
                  activeDot={false} // Gráfica limpia
                />
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
// === Fin de Componente Modal ===

// === Componente Principal ===
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- Estados para el panel de tracking ---
  const [searchTerm, setSearchTerm] = useState(""); 
  const [trackingMessage, setTrackingMessage] = useState(""); 
  
  const [chartProductTitle, setChartProductTitle] = useState(null);

  // ✅ NUEVOS ESTADOS: Filtros y Ordenamiento
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("all"); 

  // URL de Render
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // === Obtener productos (Llama a /product_history) ===
  const fetchProducts = async () => {
    setLoading(true); 
    try {
      const res = await fetch(`${API_BASE}/product_history`); 
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && data.message) {
        setProducts([]);
        console.log(data.message);
      } else {
        setProducts([]); 
        console.error("El backend devolvió un formato inesperado:", data);
      }
      
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setProducts([]); 
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };
  
  // === Cargar productos al iniciar ===
  useEffect(() => {
    fetchProducts();
  }, []); 

  // ✅ NUEVO: Función auxiliar para limpiar precios (Convierte "$1,200.00" a número)
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    // Elimina todo lo que no sea número o punto decimal
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ""));
  };

  // === Rastrear Producto (Lógica Híbrida Original) ===
  const handleTrackProduct = async () => {
    // Detectamos si es una URL para scraping
    const isUrl = searchTerm && searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");

    if (!isUrl) {
        return; 
    }
    
    setRefreshing(true); 
    setTrackingMessage("Rastreando... esto puede tardar hasta 40 segundos.");

    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || "Error desconocido al rastrear.");
      }

      console.log("Respuesta del scraping:", result);
      setTrackingMessage(result.message); 
      setSearchTerm("");
      
      await fetchProducts(); 

    } catch (err) {
      console.error("Error al rastrear producto:", err);
      setTrackingMessage(`Error: ${err.message}`); 
    } finally {
      setRefreshing(false); 
    }
  };

  // === ✅ LÓGICA DE FILTRADO Y ORDENAMIENTO (processedProducts) ===
  const processedProducts = useMemo(() => {
    // 1. Empezamos con todos los productos
    let result = [...products];

    // 2. Filtro de Búsqueda (Texto) - Si hay texto y NO es una URL, filtramos por nombre.
    if (searchTerm && !searchTerm.includes("http")) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowerSearch));
    }

    // 3. Filtro por Categoría/Estado (Dropdown)
    if (filterOption === "historical_low") {
      result = result.filter(p => p.alert_type === "low_historical");
    } else if (filterOption === "price_drop") {
      result = result.filter(p => p.status === "down");
    }

    // 4. Ordenamiento (Dropdown)
    result.sort((a, b) => {
      switch (sortOption) {
        case "price_asc":
          return parsePrice(a.price) - parsePrice(b.price);
        case "price_desc":
          return parsePrice(b.price) - parsePrice(a.price);
        case "date_asc":
          return new Date(a.timestamp) - new Date(b.timestamp);
        case "date_desc":
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    return result;
  }, [products, searchTerm, sortOption, filterOption]);

  // === Funciones auxiliares de estilo (ORIGINALES) ===
  const getPriceColor = (price) => {
    const value = parseFloat(price.replace("$", "").replace(",", ""));
    if (value < 10000) return "#d4edda";
    if (value < 20000) return "#fff3cd";
    return "#f8d7da";
  };

  const getStatusEmoji = (status) => {
    if (status === "down") return "🟢 ↓ Bajó";
    if (status === "up") return "🔴 ↑ Subió";
    if (status === "same") return "🟡 → Igual";
    return "🆕 Nuevo";
  };

  // === Renderizado principal ===
  if (loading) return <p>Cargando productos...</p>;
  
  return (
    <div className="App">
      <h1>🛒 Price Tracker (ML)</h1>

      {/* === Panel de Tracking / Buscador Híbrido + Filtros (Reestructurado) === */}
      <div className="simulate-panel">
          <h3>Añadir Nuevo Producto / Buscar en Catálogo</h3>
          
          {/* PRIMERA FILA: Búsqueda y Acciones */}
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

          {/* ✅ SEGUNDA FILA: Filtros y Ordenamiento */}
          <div className="filter-row">
              {/* Leyenda de Filtros */}
              <span className="filter-label">Filtros y Ordenamiento:</span> 
              
              {/* Selector de Ordenamiento */}
              <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{cursor: "pointer"}}
              >
                  <option value="date_desc">📅 Fecha: Reciente</option>
                  <option value="date_asc">📅 Fecha: Antiguo</option>
                  <option value="price_asc">💰 Precio: Menor a Mayor</option>
                  <option value="price_desc">💰 Precio: Mayor a Menor</option>
              </select>

              {/* Selector de Filtros */}
              <select 
                  value={filterOption} 
                  onChange={(e) => setFilterOption(e.target.value)}
                  style={{cursor: "pointer"}}
              >
                  <option value="all">👁️ Ver Todos</option>
                  <option value="historical_low">🏆 Mínimo Histórico</option>
                  <option value="price_drop">📉 Solo Ofertas (Bajó)</option>
              </select>
          </div>
          
          {/* Mensaje de estado del tracking */}
          {trackingMessage && (
            <p className="tracking-message" style={{width: "100%"}}>{trackingMessage}</p>
          )}
      </div>
      
      {/* === Grid de productos === */}
      <div className="product-grid">
        {/* ✅ Usamos processedProducts para renderizar */}
        {processedProducts.length === 0 ? (
            <p className="no-products-message">
                {searchTerm.trim() && !searchTerm.includes("http") ? 
                    `No se encontraron productos con el término "${searchTerm}".` : 
                    "No hay productos que coincidan con los filtros seleccionados."
                }
                <br />Intenta cambiar los filtros o añadir un nuevo producto con su URL.
            </p>
        ) : (
            processedProducts.map((p, index) => (
            <div
                key={index}
                className="product-card"
                style={{ backgroundColor: getPriceColor(p.price) }}
                onClick={() => setChartProductTitle(p.title)} 
            >
                {/* 🔔 ALERTA SUPERIOR */}
                {p.alert_type === "low_historical" && (
                <div className="alert-badge low_historical">
                    ¡MÍNIMO HISTÓRICO! 📉
                </div>
                )}
                
                <img src={p.image} alt={p.title} />
                <h3>{p.title}</h3>

                {/* 💰 Bloque de Precios */}
                {p.status !== "new" && p.previous_price && (
                <p className="previous-price">
                    Precio Anterior: <s>{p.previous_price}</s>
                </p>
                )}
                <p className="current-price">
                <strong>Precio: {p.price}</strong>
                </p>
                
                {/* Status de Cambio */}
                <p>
                    {getStatusEmoji(p.status)} 
                    {(p.status === "up" || p.status === "down") && (
                        <span className="change-text"> ({p.change_percentage})</span>
                    )}
                </p>
                
                {/* 📊 Bloque de Contexto */}
                {p.mode_price && (
                    <div className="context-box">
                        <p><strong>Frecuente:</strong> {p.mode_price} (visto {p.mode_price_count} veces)</p>
                        <p><strong>Mín. Registrado:</strong> {p.min_historical_price}</p>
                    </div>
                )}
                
                <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()} 
                >
                Ver producto
                </a>
                <p className="timestamp">
                {new Date(p.timestamp).toLocaleString()}
                </p> 
            </div>
            ))
        )}
      </div>
      
      {/* Renderizar el Modal si hay un producto seleccionado */}
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
