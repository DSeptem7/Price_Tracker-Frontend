import React, { useEffect, useState } from "react";
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

// === Componente Modal para la Gráfica (MODIFICADO) ===
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // ✅ CAMBIO CLAVE: Llama al nuevo endpoint /history/{product_title}
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
          // ✅ Mapeamos la data de historial del objeto 'history'
          const formattedData = data.history
            .map((item) => {
              const priceValue = parseFloat(item.price);
              
              if (isNaN(priceValue) || priceValue <= 0) return null; 

              return {
                price: priceValue,
                // Formateamos la fecha para que se vea bien en la gráfica
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
            Sigue simulando precios para este producto.
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
  const [selectedProduct, setSelectedProduct] = useState("");
  const [newPrice, setNewPrice] = useState("");
  
  const [chartProductTitle, setChartProductTitle] = useState(null);

  // ✅ URL de Render
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // === Obtener productos (Llamando ahora a /product_history) ===
  const fetchProducts = async () => {
    setRefreshing(true);
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
      
    } catch (err)
{
      console.error("Error al obtener productos:", err);
      setProducts([]); 
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  // === Cargar productos al iniciar ===
  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 30000); 
    return () => clearInterval(interval);
  }, []);

  // === Simular cambio de precio ===
  const simulatePriceChange = async () => {
    if (!selectedProduct || !newPrice || isNaN(parseFloat(newPrice))) {
      alert("Selecciona un producto y un nuevo precio válido (número).");
      return;
    }
    try {
      const url = `${API_BASE}/simulate_price?title=${encodeURIComponent(selectedProduct)}&price=${newPrice}`; 
      const res = await fetch(url);
      const result = await res.json();
      console.log("Simulación:", result);
      setNewPrice("");
      setSelectedProduct("");
      await fetchProducts(); 
    } catch (err) {
      console.error("Error al simular precio:", err);
    }
  };

  // === Funciones auxiliares ===
  const getPriceColor = (price) => {
    const value = parseFloat(price.replace("$", "").replace(",", ""));
    if (value < 10000) return "#d4edda"; // Verde claro
    if (value < 20000) return "#fff3cd"; // Amarillo claro
    return "#f8d7da"; // Rojo claro
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
      <h1>🛒 Price Tracker</h1>

      {/* === Controles de simulación === */}
      <div className="simulate-panel">
        <h3>🎯 Simular cambio de precio</h3>
        {products.length > 0 ? (
          <>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Selecciona un producto...</option>
              {products.map((p, i) => (
                <option key={i} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Nuevo precio (ej: 1500.50)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <button onClick={simulatePriceChange} disabled={!selectedProduct || !newPrice}>
              Simular precio
            </button>
          </>
        ) : (
          <p>Usa la URL de Simulación en tu navegador para el primer producto.</p>
        )}
        <button onClick={fetchProducts} disabled={refreshing}>
          {refreshing ? "Actualizando..." : "🔄 Actualizar lista"}
        </button>
      </div>
      
      {/* === Grid de productos === */}
      <div className="product-grid">
        {products.length === 0 ? (
            <p className="no-products-message">
                No hay productos registrados en la base de datos.
                <br />Usa la URL: **{API_BASE}/simulate_price?title=Mi%20Producto%20X&price=10000**
                <br/>para añadir el primer registro.
            </p>
        ) : (
            products.map((p, index) => (
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
