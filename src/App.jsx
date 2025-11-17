import React, { useEffect, useState, useCallback } from "react";
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

// === Componente Modal para la Gráfica ===
function PriceChartModal({ productTitle, onClose, apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Llama al endpoint /history/{product_title}
        const url = `${apiBase}/history/${encodeURIComponent(
          productTitle
        )}`;
        // Implementación de reintento con backoff (Añadido para robustez)
        let res;
        for (let attempt = 0; attempt < 3; attempt++) {
            res = await fetch(url);
            if (res.ok || res.status === 404) {
                break; // Éxito o no encontrado, salir
            }
            if (attempt < 2) {
                console.warn(`Intento de historial ${attempt + 1} fallido. Reintentando...`);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            } else {
                // Último intento fallido
                throw new Error(`Fallo en la conexión después de ${attempt + 1} intentos.`);
            }
        }
        
        if (res.status === 404) {
             setHistory([]);
             return;
        }
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || `Error ${res.status} al obtener historial.`);
        }

        const data = await res.json();
        
        if (data && Array.isArray(data.history)) {
          // Mapeamos la data de historial
          const formattedData = data.history
            .map((item) => {
              // Aseguramos que 'price' sea numérico para la gráfica
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
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productTitle) {
      fetchHistory();
    }
  }, [productTitle, apiBase]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-2xl" onClick={onClose}>
          &times;
        </button>
        <h3 className="text-xl font-bold mb-4">Historial de Precio: {productTitle}</h3>
        {loading ? (
          <p className="text-center py-8">Cargando historial...</p>
        ) : fetchError ? (
          <p className="text-center text-red-600 py-8">Error al cargar: {fetchError}</p>
        ) : history.length > 1 ? (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" interval="preserveStartEnd" angle={-15} textAnchor="end" height={60} style={{ fontSize: '12px' }} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(2)}`} /> 
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, "Precio"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4f46e5"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">
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
  const [newProductUrl, setNewProductUrl] = useState("");
  const [trackingMessage, setTrackingMessage] = useState(""); // Para mostrar mensajes de éxito/error
  const [trackingError, setTrackingError] = useState(null); // Para errores del rastreo
  
  const [chartProductTitle, setChartProductTitle] = useState(null);

  // ✅ URL de Render
  const API_BASE = "https://price-tracker-nov-2025.onrender.com"; 
  
  // === Obtener productos (Llama a /product_history) ===
  const fetchProducts = useCallback(async (showLoader = false) => {
    if(showLoader) setLoading(true); // Solo mostrar loading en la carga inicial
    setRefreshing(true); // Usamos refreshing para la actualización de la lista
    setTrackingError(null); // Limpiar errores
    setTrackingMessage("");

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
      setTrackingError(`No se pudo conectar al servidor o a la DB: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false); // Detenemos ambos loaders
    }
  }, [API_BASE]); // Dependencia del API_BASE

  // === Cargar productos al iniciar ===
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]); // Dependencia de fetchProducts (useCallback)

  // === ✅ NUEVA FUNCIÓN: Rastrear Producto (Corregida) ===
  const handleTrackProduct = useCallback(async () => {
    if (!newProductUrl || !newProductUrl.includes("mercadolibre.com")) {
      setTrackingError("Por favor, ingresa una URL válida de Mercado Libre (.com.mx).");
      return;
    }

    setRefreshing(true); // Usamos 'refreshing' para indicar la carga del tracking
    setTrackingError(null);
    setTrackingMessage("Rastreando... esto puede tardar hasta 40 segundos.");

    try {
      // Llamamos al endpoint de scraping /products
      const url = `${API_BASE}/products?url=${encodeURIComponent(newProductUrl)}`;
      
      // Implementación de reintento con backoff (mejora de robustez)
      let res;
      let result;
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(url);
        result = await res.json();

        if (res.ok) {
          // Éxito: Salir del bucle
          break; 
        } else if (attempt < 2 && res.status >= 500) {
          // Error 5xx, intentar de nuevo después de una pausa
          console.warn(`Intento ${attempt + 1} fallido. Reintentando en ${Math.pow(2, attempt)}s...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          // Error 4xx o último intento 5xx fallido
          throw new Error(result.detail || `Error ${res.status}: Fallo en el scraping.`);
        }
      }

      console.log("Respuesta del scraping:", result);
      setTrackingMessage(result.message); // "Scraping completado..."
      setNewProductUrl(""); // Limpiar input
      
      // *** 🎯 CORRECCIÓN CLAVE: Asegurar la recarga de datos ***
      // Usamos el estado de éxito para forzar la recarga
      await fetchProducts(); 

    } catch (err) {
      console.error("Error al rastrear producto:", err);
      setTrackingError(`Error de rastreo: ${err.message}`); // Mostrar error en la UI
      setTrackingMessage(""); // Limpiar mensaje de éxito potencial
    } finally {
      setRefreshing(false); // Detener el loader
    }
  }, [newProductUrl, API_BASE, fetchProducts]); // Dependencia de fetchProducts

  // === Funciones auxiliares ===
  const getPriceColor = (price) => {
    // Limpieza de formato para comparación numérica
    const value = parseFloat(price.replace("$", "").replace(",", "")); 
    if (isNaN(value)) return "bg-gray-100"; // Manejar el caso de precio no válido
    if (value < 10000) return "bg-green-100";
    if (value < 20000) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getStatusEmoji = (status) => {
    if (status === "down") return "🟢 ↓ Bajó";
    if (status === "up") return "🔴 ↑ Subió";
    if (status === "same") return "🟡 → Igual";
    return "🆕 Nuevo";
  };

  // === Renderizado principal ===
  if (loading) return <p className="text-center p-8 text-xl font-medium">Cargando productos...</p>;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
        {/*
          FIX CRÍTICO: Se añade CSS simple para forzar un fondo claro y mejorar la legibilidad.
          Esto soluciona el problema de la "pantalla negra" si Tailwind no está cargando.
        */}
        <style>
            {`
            /* FIX: Garantizar un fondo claro y un modelo de caja consistente */
            body, html, #root {
                background-color: #f9fafb !important; 
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            .product-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 24px;
                padding-top: 32px;
            }
            .product-card {
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: pointer;
                position: relative;
                border: 1px solid #e5e7eb;
            }
            .product-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
            }
            .product-card img {
                width: 100%;
                height: 200px;
                object-fit: contain;
                border-radius: 8px;
                margin-bottom: 12px;
                background-color: white;
            }
            .current-price {
                font-size: 1.5rem;
                color: #1f2937;
                margin: 8px 0;
            }
            .previous-price {
                color: #6b7280;
                font-size: 0.9rem;
            }
            .change-text {
                font-weight: bold;
                margin-left: 4px;
            }
            .context-box {
                margin-top: 12px;
                padding: 8px;
                border: 1px dashed #d1d5db;
                border-radius: 8px;
                font-size: 0.85rem;
                background-color: rgba(255, 255, 255, 0.5);
            }
            .timestamp {
                font-size: 0.75rem;
                color: #9ca3af;
                margin-top: 10px;
            }
            .alert-badge {
                position: absolute;
                top: -10px;
                right: -10px;
                background-color: #ef4444; /* Rojo para alertas */
                color: white;
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .low_historical {
                background-color: #10b981; /* Verde para mínimo histórico */
            }
            `}
        </style>

        <header className="text-center py-8">
            <h1 className="text-4xl font-extrabold text-gray-900">
                🛒 Price Tracker (Mercado Libre)
            </h1>
        </header>

        {/* === ✅ Panel de Tracking === */}
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg space-y-4 mb-8 border border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2">Añadir Nuevo Producto</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="url"
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    placeholder="Pega la URL de Mercado Libre aquí (e.g., mercadolibre.com.mx/...)"
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                    disabled={refreshing}
                />
                <button 
                    onClick={handleTrackProduct} 
                    disabled={refreshing || !newProductUrl}
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                    {refreshing ? (
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : "Rastrear Producto"}
                </button>
                <button onClick={() => fetchProducts()} disabled={refreshing} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50">
                    🔄 Actualizar Lista
                </button>
            </div>
            
            {/* Mensaje de estado del tracking */}
            {(trackingMessage || trackingError) && (
                <div 
                    className={`p-3 rounded-lg text-sm font-medium ${
                        trackingError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                >
                    {trackingError ? <strong>¡Error!</strong> : <strong>Éxito:</strong>} {trackingError || trackingMessage}
                </div>
            )}
        </div>
        
        {/* === Grid de productos === */}
        <div className="product-grid">
            {products.length === 0 ? (
                <p className="col-span-full text-center text-xl text-gray-500 mt-16">
                    No hay productos registrados en la base de datos.
                    <br />Usa el panel de arriba para añadir tu primer producto.
                </p>
            ) : (
                products.map((p, index) => (
                    <div
                        key={index}
                        className={`product-card ${getPriceColor(p.price)}`}
                        onClick={() => setChartProductTitle(p.title)} 
                    >
                        {/* 🔔 ALERTA SUPERIOR */}
                        {p.alert_type === "low_historical" && (
                        <div className="alert-badge low_historical">
                            ¡MÍNIMO HISTÓRICO! 📉
                        </div>
                        )}
                        
                        <img src={p.image} alt={p.title} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/220x220/8b5cf6/ffffff?text=No+Image" }} />
                        <h3 className="font-semibold text-gray-800 text-lg mb-2 truncate" title={p.title}>{p.title}</h3>

                        {/* 💰 Bloque de Precios */}
                        {p.status !== "new" && p.previous_price && (
                        <p className="previous-price">
                            Precio Anterior: <s>{p.previous_price}</s>
                        </p>
                        )}
                        <p className="current-price">
                        <strong>Precio Actual: {p.price}</strong>
                        </p>
                        
                        {/* Status de Cambio */}
                        <p className={`font-medium ${p.status === "down" ? 'text-green-600' : p.status === 'up' ? 'text-red-600' : 'text-gray-600'}`}>
                            {getStatusEmoji(p.status)} 
                            {(p.status === "up" || p.status === "down") && (
                                <span className="change-text"> ({p.change_percentage})</span>
                            )}
                        </p>
                        
                        {/* 📊 Bloque de Contexto */}
                        {p.mode_price && (
                            <div className="context-box mt-3">
                                <p><strong>Frecuente:</strong> {p.mode_price} (visto {p.mode_price_count} veces)</p>
                                <p><strong>Mín. Registrado:</strong> {p.min_historical_price}</p>
                            </div>
                        )}
                        
                        <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        onClick={(e) => e.stopPropagation()} 
                        >
                        Ver producto en ML
                        </a>
                        <p className="timestamp">
                        Última revisión: {new Date(p.timestamp).toLocaleString()}
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