import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./App.css"; 

// ⚠️ Se asume que App.css contiene los nuevos estilos para loaders, cards, y modals.

// === Componente Modal para la Gráfica (ACTUALIZADO con RANGOS) ===
function PriceChartModal({ productTitle, historyData, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("ALL"); // '1W', '1M', '6M', 'ALL'

  // --- LÓGICA DE OBTENCIÓN Y FILTRADO DEL HISTORIAL ---
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const url = `${apiBase}/history/${encodeURIComponent(productTitle)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          if (res.status === 404) setHistory([]);
          throw new Error("Error al cargar historial");
        }

        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          const formattedData = data.history
            .map((item) => {
              const priceValue = parseFloat(item.price);
              if (isNaN(priceValue) || priceValue <= 0) return null; 

              return {
                price: priceValue,
                dateObj: new Date(item.timestamp), // Para filtrar
                date: new Date(item.timestamp).toLocaleString("es-MX", {
                  day: "numeric",
                  month: "short",
                }),
              };
            })
            .filter(item => item !== null)
            .sort((a, b) => a.dateObj - b.dateObj); // Ordenar por fecha ascendente
            
          setHistory(formattedData);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Error al obtener historial:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (productTitle) {
      fetchHistory();
    }
  }, [productTitle, apiBase]);

  // --- FILTRADO DE GRÁFICA POR TIEMPO (CLIENTE) ---
  const getFilteredChartData = useMemo(() => {
    if (history.length === 0) return [];
    
    const now = new Date();
    let cutoff = new Date(0); // Por defecto 1970 (Todo)

    if (chartRange === '1W') cutoff = new Date(now.setDate(now.getDate() - 7));
    if (chartRange === '1M') cutoff = new Date(now.setMonth(now.getMonth() - 1));
    if (chartRange === '6M') cutoff = new Date(now.setMonth(now.getMonth() - 6));
    
    return history.filter(h => h.dateObj >= cutoff);
  }, [history, chartRange]);


  // Si hay un error, el modal se muestra igual, pero con el mensaje.
  const chartData = getFilteredChartData;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h3>Historial de Precio: {productTitle}</h3>
        
        {loading ? (
          <p>Cargando historial...</p>
        ) : chartData.length > 1 ? ( 
          <>
            {/* Controles de Rango de Gráfica */}
            <div className="chart-controls">
                <button className={chartRange === '1W' ? 'active' : ''} onClick={() => setChartRange('1W')}>1 Sem</button>
                <button className={chartRange === '1M' ? 'active' : ''} onClick={() => setChartRange('1M')}>1 Mes</button>
                <button className={chartRange === '6M' ? 'active' : ''} onClick={() => setChartRange('6M')}>6 Meses</button>
                <button className={chartRange === 'ALL' ? 'active' : ''} onClick={() => setChartRange('ALL')}>Todo</button>
            </div>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
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
                    stroke="#007bff" // Color mejorado
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
            <div className="new-product-msg">
                <h3>✨ Producto Nuevo o Sin Datos</h3>
                <p>
                    {history.length === 0 ? 
                        "El historial no fue encontrado. Verifica el título o intenta de nuevo." : 
                        "Acabamos de empezar a rastrear este producto. Vuelve pronto para ver la gráfica de precios."
                    }
                </p>
          </div>
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
  
  // --- Estados para el buscador y feedback ---
  const [searchTerm, setSearchTerm] = useState(""); // Usado como input de URL/Texto
  const [isScraping, setIsScraping] = useState(false); // Para el loader dinámico
  const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // --- Estados para la visualización ---
  const [chartProductTitle, setChartProductTitle] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12); // Paginación cliente

  // ✅ URL de Render
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // === Obtener productos (Llama a /product_history) ===
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/product_history`); 
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Ordenamos por fecha de actualización (más reciente primero)
        const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setProducts(sorted);
      } else if (data && data.message) {
        setProducts([]);
      } else {
        setProducts([]); 
        console.error("El backend devolvió un formato inesperado:", data);
      }
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };
  
  // === Cargar productos al iniciar ===
  useEffect(() => {
    fetchProducts();
  }, []); 

  // === ✅ LÓGICA DEL BUSCADOR HÍBRIDO Y SCRAPING ===
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const isUrl = searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");

    if (isUrl) {
      // --- MODO SCRAPING (Con Loader Dinámico) ---
      setIsScraping(true);
      setFeedbackMessage(null); // Limpiar mensaje anterior
      
      try {
        const url = `${API_BASE}/products?url=${encodeURIComponent(searchTerm)}`;
        const res = await fetch(url);
        const result = await res.json();

        if (!res.ok) {
            // Manejo de errores 4xx/5xx del backend
            throw new Error(result.detail || "Error desconocido al rastrear.");
        }

        const productTitle = result.title || "el producto";

        if (result.status === "added") {
            setFeedbackMessage({ 
                type: 'success', 
                text: `✅ El producto "${productTitle}" fue agregado con éxito, a partir de ahora se rastreará su precio.` 
            });
        } else if (result.status === "updated") {
             setFeedbackMessage({ 
                type: 'info', 
                text: `ℹ️ El producto "${productTitle}" ya se encontraba en la base de datos y fue actualizado.` 
            });
        }
        
        await fetchProducts(); // Recargar la lista para incluir/actualizar el producto

        // ✅ UX: Mostrar solo el producto agregado (o actualizado)
        setSearchTerm(productTitle); 
        setChartProductTitle(null); // Asegurar que no quede modal abierto

      } catch (err) {
        setFeedbackMessage({ type: 'error', text: `❌ Error: ${err.message}. Verifica el enlace.` });
      } finally {
        setIsScraping(false);
      }
    } else {
      // --- MODO BÚSQUEDA INTERNA (Filtra en la lista existente) ---
      // El useMemo `filteredProducts` se encarga de esto.
      setFeedbackMessage(null);
    }
  };

  // --- FILTRADO DE PRODUCTOS (BUSCADOR INTERNO) ---
  const filteredProducts = useMemo(() => {
    // Si estamos en modo scraping (cargando), mostramos el último estado de la lista
    if (isScraping) return products;

    // Si el término es vacío, mostramos todos
    if (!searchTerm.trim()) return products;

    // Si es URL, ya la manejamos en handleSearch, aquí solo filtramos por texto
    const isUrl = searchTerm.includes("http");
    if (isUrl) return products;

    const lowerCaseSearch = searchTerm.toLowerCase();

    return products.filter(p => 
      p.title.toLowerCase().includes(lowerCaseSearch) ||
      p.url.toLowerCase().includes(lowerCaseSearch) // Opcional: Buscar también en URL
    );
  }, [products, searchTerm, isScraping]);

  // === Renderizado principal ===
  
  // Funciones auxiliares (mantienen su función, solo se limpian de `App.css` para el nuevo estilo)
  const getPriceColor = (price) => { /* ... */ }; // Mantener para el estilo anterior si quieres
  const getStatusEmoji = (status) => { /* ... */ }; // Mantener para el texto

  if (loading) return <p>Cargando productos...</p>;
  
  return (
    <div className="App">
      {/* OVERLAY DE SCRAPING CON ANIMACIÓN */}
      {isScraping && (
          <div className="loading-overlay">
            <div className="loader-box">
              <div className="spinner"></div>
              <p>Rastreando precio<span className="dots"></span></p>
            </div>
          </div>
      )}

      <header className="app-header">
        <h1>🛒 Price Tracker (ML)</h1>
        
        {/* BUSCADOR HÍBRIDO (Reemplaza simulate-panel input) */}
        <form onSubmit={handleSearch} className="search-container">
            <input
                type="text"
                placeholder="Pega URL de ML o busca producto en el catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isScraping}
            />
            <button type="submit" disabled={isScraping || !searchTerm.trim()}>
                {isScraping ? "Analizando..." : "Buscar / Rastrear"}
            </button>
        </form>
        
        {/* MENSAJES DE ÉXITO / ERROR (Reemplaza tracking-message) */}
        {feedbackMessage && !isScraping && (
          <div className={`feedback-msg ${feedbackMessage.type}`}>
            {feedbackMessage.text}
            <button onClick={() => setFeedbackMessage(null)}>×</button>
          </div>
        )}

        {/* Botón de actualizar lista separado */}
        <button onClick={() => { setSearchTerm(""); fetchProducts(); }} disabled={isScraping} className="refresh-btn">
          🔄 Actualizar toda la Lista
        </button>
      </header>
      
      {/* === Grid de productos === */}
      <div className="product-grid">
        {filteredProducts.length === 0 ? (
            <p className="no-products-message">
                {searchTerm.trim() ? 
                    `No se encontraron productos con el término "${searchTerm}".` :
                    "No hay productos registrados en la base de datos."
                }
                <br />Usa el panel de búsqueda para agregar un enlace.
            </p>
        ) : (
            filteredProducts.slice(0, visibleCount).map((p, index) => (
            <div
                key={index}
                className="product-card"
                // Aquí podrías usar getPriceColor(p.price) si quieres mantener el color
                onClick={() => setChartProductTitle(p.title)} 
            >
                {/* 🔔 ALERTA SUPERIOR */}
                {p.alert_type === "low_historical" && (
                    <div className="alert-badge low_historical">¡MÍNIMO HISTÓRICO! 📉</div>
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

      {/* BOTÓN VER MÁS (PAGINACIÓN CLIENTE) */}
      {filteredProducts.length > visibleCount && (
        <button className="load-more-btn" onClick={() => setVisibleCount(prev => prev + 12)}>
          Ver más productos ({filteredProducts.length - visibleCount} restantes)
        </button>
      )}
      
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