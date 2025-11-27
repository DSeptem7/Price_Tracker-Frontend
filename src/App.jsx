import React, { useEffect, useState, useMemo } from "react"; // ✅ IMPORTAR useMemo
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
// Asumiendo que App.css existe y tiene los estilos que ya definimos.

// === Componente Modal para la Gráfica (ACTUALIZADO) ===
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Llama al nuevo endpoint /history/{product_title}
        const url = `${apiBase}/history/${encodeURIComponent(
          productTitle
        )}`;
        const res = await fetch(url);
        
        if (res.status === 404) {
             setHistory([]);
             console.log("Historial no encontrado para el producto.");
             return;
        }

        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          // Mapeamos la data de historial del objeto 'history'
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h3>Historial de Precio: {productTitle}</h3>
        {loading ? (
          <p>Cargando historial...</p>
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
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>
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
  
  // --- Estados para el nuevo panel de tracking ---
  // ❌ Renombramos newProductUrl a searchTerm
  const [searchTerm, setSearchTerm] = useState(""); 
  const [trackingMessage, setTrackingMessage] = useState(""); 
  
  const [chartProductTitle, setChartProductTitle] = useState(null);

  // ✅ URL de Render
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

  // === ✅ NUEVA FUNCIÓN: Rastrear Producto (y detecta búsqueda) ===
  const handleTrackProduct = async () => {
    // Detectamos si es una URL para scraping
    const isUrl = searchTerm && searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");

    if (!isUrl) {
        // Si no es URL, no hacemos nada. El useMemo filtrará la lista.
        return; 
    }
    
    // --- LÓGICA DE SCRAPING (solo si es URL) ---
    setRefreshing(true); 
    setTrackingMessage("Rastreando... esto puede tardar hasta 40 segundos.");

    try {
      // Llamamos al endpoint de scraping /products
      const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`; // ✅ Usamos searchTerm
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || "Error desconocido al rastrear.");
      }

      console.log("Respuesta del scraping:", result);
      setTrackingMessage(result.message); 
      setSearchTerm(""); // Limpiar input después de scraping exitoso
      
      await fetchProducts(); 

    } catch (err) {
      console.error("Error al rastrear producto:", err);
      setTrackingMessage(`Error: ${err.message}`); 
    } finally {
      setRefreshing(false); 
    }
  };

  // === ✅ FILTRO INTERNO: Filtra productos mostrados por el término de búsqueda ===
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.includes("http")) {
      return products; // Muestra todo si está vacío o si es una URL (esperamos scraping)
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    return products.filter(p => 
      p.title.toLowerCase().includes(lowerCaseSearch)
    );
  }, [products, searchTerm]);


  // === Funciones auxiliares (Sin cambios) ===
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

      {/* === ✅ Panel de Tracking / Buscador Híbrido === */}
      <div className="simulate-panel">
        <h3>Añadir Nuevo Producto / Buscar en Catálogo</h3> {/* ✅ Texto actualizado */}
        <input
          type="text" // ✅ Cambiamos a type="text" para aceptar palabras
          placeholder="Pega URL de ML o escribe para buscar aquí" // ✅ Placeholder actualizado
          value={searchTerm} // ✅ Usamos searchTerm
          onChange={(e) => setSearchTerm(e.target.value)} // ✅ Usamos setSearchTerm
          style={{width: "400px"}} 
        />
        <button onClick={handleTrackProduct} disabled={refreshing || !searchTerm}> {/* ✅ Usamos handleTrackProduct */}
          {refreshing ? "Rastreando..." : "Rastrear / Buscar"} {/* ✅ Texto actualizado */}
        </button>
        <button onClick={() => { setSearchTerm(""); fetchProducts(); }} disabled={refreshing}> {/* ✅ Limpiamos el buscador al actualizar */}
          {refreshing ? "Actualizando..." : "🔄 Actualizar Lista"}
        </button>
        
        {/* Mensaje de estado del tracking */}
        {trackingMessage && (
          <p className="tracking-message">{trackingMessage}</p>
        )}
      </div>
      
      {/* === Grid de productos === */}
      <div className="product-grid">
        {/* ✅ Usamos filteredProducts en lugar de products */}
        {filteredProducts.length === 0 ? (
            <p className="no-products-message">
                {searchTerm.trim() ? 
                    `No se encontraron productos con el término "${searchTerm}".` : 
                    "No hay productos registrados en la base de datos."
                }
                <br />Usa el panel de arriba para añadir tu primer producto.
            </p>
        ) : (
            // ✅ Usamos filteredProducts en lugar de products
            filteredProducts.map((p, index) => (
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