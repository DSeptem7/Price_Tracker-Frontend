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

/* ------------------------------------------------------------------
   === Loader Rastreando… con puntos animados ===
------------------------------------------------------------------ */
const Loader = () => (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <span className="loading-text">
      Rastreando<span className="dots"></span>
    </span>
  </div>
);

// Inyectar estilos del loader
const loaderCSS = `
.loading-text {
    font-size: 18px;
    font-weight: 700;
    color: #444;
    margin-top: 20px;
}

.dots::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
    0% { content: ''; }
    25% { content: '.'; }
    50% { content: '..'; }
    75% { content: '...'; }
    100% { content: ''; }
}
`;

const loaderStyleTag = document.createElement("style");
loaderStyleTag.innerHTML = loaderCSS;
document.head.appendChild(loaderStyleTag);

/* ------------------------------------------------------------------
   === Componente Modal para la Gráfica
------------------------------------------------------------------ */
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        const url = `${apiBase}/history/${encodeURIComponent(productTitle)}`;
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
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
            })
            .filter(Boolean);

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

    if (productTitle) fetchHistory();
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
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Precio"]} />
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
          <p>No hay suficiente historial para mostrar una gráfica.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   === Componente Principal
------------------------------------------------------------------ */
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [newProductUrl, setNewProductUrl] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [chartProductTitle, setChartProductTitle] = useState(null);

  const API_BASE = "https://price-tracker-nov-2025.onrender.com";

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/product_history`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleTrackProduct = async () => {
    if (!newProductUrl || !newProductUrl.includes("mercadolibre.com")) {
      alert("Ingresa una URL válida de Mercado Libre.");
      return;
    }

    setRefreshing(true);
    setTrackingMessage("Rastreando… esto puede tardar hasta 40 segundos.");

    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(
        newProductUrl
      )}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) throw new Error(result.detail || "Error desconocido");

      setTrackingMessage(result.message);
      setNewProductUrl("");
      await fetchProducts();
    } catch (err) {
      setTrackingMessage(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

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

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="App">
      <h1>🛒 Price Tracker (ML)</h1>

      <div className="simulate-panel">
        <h3>Añadir Nuevo Producto</h3>

        <input
          type="url"
          placeholder="Pega la URL de Mercado Libre aquí"
          value={newProductUrl}
          onChange={(e) => setNewProductUrl(e.target.value)}
          style={{ width: "400px" }}
        />

        <button onClick={handleTrackProduct} disabled={refreshing}>
          Rastrear Producto
        </button>

        <button onClick={fetchProducts} disabled={refreshing}>
          🔄 Actualizar Lista
        </button>

        {/* 🔥 Loader dinámico */}
        {refreshing && <Loader />}

        {/* Mensaje de estado */}
        {trackingMessage && <p className="tracking-message">{trackingMessage}</p>}
      </div>

      <div className="product-grid">
        {products.length === 0 ? (
          <p>No hay productos registrados.</p>
        ) : (
          products.map((p, index) => (
            <div
              key={index}
              className="product-card"
              style={{ backgroundColor: getPriceColor(p.price) }}
              onClick={() => setChartProductTitle(p.title)}
            >
              {p.alert_type === "low_historical" && (
                <div className="alert-badge low_historical">
                  ¡MÍNIMO HISTÓRICO! 📉
                </div>
              )}

              <img src={p.image} alt={p.title} />
              <h3>{p.title}</h3>

              {p.previous_price && (
                <p className="previous-price">
                  Precio Anterior: <s>{p.previous_price}</s>
                </p>
              )}

              <p className="current-price">
                <strong>Precio: {p.price}</strong>
              </p>

              <p>
                {getStatusEmoji(p.status)}
                {["up", "down"].includes(p.status) && (
                  <span className="change-text"> ({p.change_percentage})</span>
                )}
              </p>

              {p.mode_price && (
                <div className="context-box">
                  <p>
                    <strong>Frecuente:</strong> {p.mode_price} (visto{" "}
                    {p.mode_price_count} veces)
                  </p>
                  <p>
                    <strong>Mín. Registrado:</strong> {p.min_historical_price}
                  </p>
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
