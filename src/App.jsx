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
// Asumiendo que App.css existe y tiene los estilos que ya definimos.

// Función auxiliar para formatear la etiqueta de fecha de forma dinámica
const formatDateLabel = (timestamp, includeTime) => {
    // Definición de opciones de formato
    const options = { 
        day: "numeric",
        month: "short",
        // Solo incluye hora/minuto si includeTime es true
        hour: includeTime ? "2-digit" : undefined, 
        minute: includeTime ? "2-digit" : undefined,
        hour12: false // Usa formato de 24 horas si hay hora
    };
    
    // Formatea la fecha y elimina la coma final si no hay hora
    return new Date(timestamp).toLocaleString("es-MX", options).replace(/,$/, '').trim();
};

// ======================================================================
// === Componente Modal para la Gráfica (CON RANGOS Y USABILIDAD MEJORADA) ===
// ======================================================================
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("ALL"); 
  const [showTime, setShowTime] = useState(false); // Estado para alternar entre fecha/hora

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        const url = `${apiBase}/history/${encodeURIComponent(
          productTitle
        )}`;
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
                dateObj: new Date(item.timestamp), 
                // Etiqueta de fecha simple para la vista predeterminada (eje X sin rotación)
                date: formatDateLabel(item.timestamp, false), 
                // Etiqueta de fecha completa (con hora) para el Tooltip y vista detallada
                fullDate: formatDateLabel(item.timestamp, true) 
              };
            })
            .filter(item => item !== null)
            .sort((a, b) => a.dateObj - b.dateObj); // Asegurar orden cronológico
            
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


  // LÓGICA DE FILTRADO DE DATOS POR RANGO (useMemo para eficiencia)
  const getFilteredChartData = useMemo(() => {
    if (history.length === 0) return [];
    
    const now = new Date();
    let cutoff = new Date(0); 

    if (chartRange === '1W') cutoff = new Date(now.setDate(now.getDate() - 7));
    if (chartRange === '1M') cutoff = new Date(now.setMonth(now.getMonth() - 1));
    if (chartRange === '6M') cutoff = new Date(now.setMonth(now.getMonth() - 6));
    
    // Filtramos usando el objeto de fecha real (dateObj)
    return history.filter(h => h.dateObj >= cutoff);
  }, [history, chartRange]); 

  const chartData = getFilteredChartData;
  
  // Función para manejar el cambio de rango y ajustar el estado showTime
  const handleRangeChange = (range) => {
      setChartRange(range);
      // Por defecto, muestra la hora solo en la vista de 1 semana para evitar saturación
      setShowTime(range === '1W');
  };

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
            {/* Controles de Rango y de Hora */}
            <div className="chart-controls">
                {/* Botones de Rango, llaman a handleRangeChange */}
                <button className={chartRange === '1W' ? 'active' : ''} onClick={() => handleRangeChange('1W')}>1 Semana</button>
                <button className={chartRange === '1M' ? 'active' : ''} onClick={() => handleRangeChange('1M')}>1 Mes</button>
                <button className={chartRange === '6M' ? 'active' : ''} onClick={() => handleRangeChange('6M')}>6 Meses</button>
                <button className={chartRange === 'ALL' ? 'active' : ''} onClick={() => handleRangeChange('ALL')}>Todo</button>
                
                {/* Botón de Hora/Fecha que alterna el modo de visualización */}
                <button 
                    className={showTime ? 'active secondary' : 'secondary'} 
                    onClick={() => setShowTime(!showTime)}
                >
                    {showTime ? 'Hora / Fecha' : 'Solo Fecha'}
                </button>
            </div>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* Eje X: Cambia el dataKey y la rotación según showTime */}
                  <XAxis 
                      dataKey={showTime ? "fullDate" : "date"} 
                      interval="preserveStartEnd" 
                      tickCount={showTime ? 10 : 6} 
                      angle={showTime ? -20 : 0} 
                      textAnchor={showTime ? "end" : "middle"} 
                  />
                  {/* ✅ Eje Y: Signo de pesos ($) y sin decimales en el eje */}
                  <YAxis 
                      domain={["auto", "auto"]} 
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                  /> 
                  <Tooltip
                    // Asegura que el tooltip siempre muestre la fecha completa (con hora)
                    labelFormatter={(label) => `Fecha: ${label}`}
                    // Formatea el valor del precio con dos decimales en el tooltip
                    formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#007bff"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          /* Leyenda para Producto Nuevo o sin datos */
          <div className="new-product-msg">
            <h3>✨ Producto Nuevo o Sin Datos</h3>
            <p>
                {history.length === 0 ? 
                    "El historial no fue encontrado o la API está devolviendo datos inesperados." : 
                    "Acabamos de empezar a rastrear este producto. Vuelve pronto para ver la gráfica de precios (se necesitan al menos 2 precios distintos)."
                }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// === Fin de Componente Modal ===

// === Componente Principal (App) ===
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- Estados para el buscador y feedback ---
  const [searchTerm, setSearchTerm] = useState(""); 
  const [trackingMessage, setTrackingMessage] = useState(""); 
  
  const [chartProductTitle, setChartProductTitle] = useState(null);

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

  // === Rastrear Producto (y detecta búsqueda) ===
  const handleSearch = async (e) => {
    e.preventDefault(); 

    const isUrl = searchTerm && searchTerm.includes("http") && searchTerm.includes("mercadolibre.com");

    if (!isUrl) {
        // Modo Búsqueda Interna (el useMemo lo maneja)
        return; 
    }
    
    // --- LÓGICA DE SCRAPING (solo si es URL) ---
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

  // === FILTRO INTERNO: Filtra productos mostrados por el término de búsqueda ===
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.includes("http")) {
      return products; 
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

      {/* === Panel de Tracking / Buscador Híbrido === */}
      <div className="simulate-panel">
        <h3>Añadir Nuevo Producto / Buscar en Catálogo</h3>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
                type="text" 
                placeholder="Pega URL de ML o escribe para buscar aquí" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{width: "400px"}}
            />
            <button type="submit" disabled={refreshing || !searchTerm}> 
                {refreshing ? "Rastreando..." : "Rastrear / Buscar"}
            </button>
        </form>
        
        <button onClick={() => { setSearchTerm(""); fetchProducts(); }} disabled={refreshing}>
          {refreshing ? "Actualizando..." : "🔄 Actualizar Lista"}
        </button>
        
        {/* Mensaje de estado del tracking */}
        {trackingMessage && (
          <p className="tracking-message">{trackingMessage}</p>
        )}
      </div>
      
      {/* === Grid de productos === */}
      <div className="product-grid">
        {filteredProducts.length === 0 ? (
            <p className="no-products-message">
                {searchTerm.trim() ? 
                    `No se encontraron productos con el término "${searchTerm}".` : 
                    "No hay productos registrados en la base de datos."
                }
                <br />Usa el panel de arriba para añadir tu primer producto.
            </p>
        ) : (
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