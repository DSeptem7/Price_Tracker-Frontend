import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

// Asegúrate de que esta URL sea la de tu servicio en Render.
// Nota: La URL real se establecería como una variable de entorno en Vercel
const API_BASE_URL = "https://tu-servicio-de-render.onrender.com"; 

// ====================================================================
// UTILIDAD DE FORMATO DE FECHA
// ====================================================================

/**
 * Formatea una fecha ISO a un formato legible en español.
 * @param {string} isoString - Fecha ISO (ej. '2024-05-15T15:00:00+00:00').
 * @returns {string} Fecha formateada.
 */
const formatTimestamp = (isoString) => {
  if (!isoString) return "Fecha desconocida";
  try {
    const date = new Date(isoString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZoneName: 'short'
    };
    return date.toLocaleString('es-MX', options);
  } catch (e) {
    return "Fecha inválida";
  }
};


// ====================================================================
// COMPONENTE PRINCIPAL (App)
// ====================================================================

const App = () => {
  const [searchUrl, setSearchUrl] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // URL base, asumiendo que el usuario reemplazará esta cadena.
  const REAL_API_URL = API_BASE_URL.includes("tu-servicio-de-render.onrender.com") 
    ? API_BASE_URL 
    : API_BASE_URL;

  // Carga inicial de todos los productos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${REAL_API_URL}/product_history`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      let data = await response.json();
      
      // Maneja el caso en que el backend devuelve un mensaje de error o info
      if (data && data.message) {
         setProducts([]); // Vacía si no hay productos
         setLoading(false);
         return;
      }
      
      // Si la data es una lista, la ordena por tiempo descendente
      if (Array.isArray(data)) {
        // Ordena por fecha de forma descendente para que el más nuevo esté primero
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setProducts(sortedData);
      } else {
        // Si el formato es inesperado, lo deja vacío
        setProducts([]);
        console.error("Formato de respuesta de historial inesperado:", data);
      }
      
    } catch (err) {
      console.error("Fallo en la carga inicial de productos:", err);
      setError("Fallo al conectar con el servidor de precios. ¿Está desplegado en Render?");
      setProducts([]); // Asegura que la lista esté vacía si hay error
    } finally {
      setLoading(false);
    }
  }, [REAL_API_URL]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejador para añadir/actualizar un producto
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // FIX 1: Vaciamos la URL de búsqueda al inicio para que no se quede.
    const urlToFetch = searchUrl;
    setSearchUrl(''); 

    if (!urlToFetch.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${REAL_API_URL}/products?url=${encodeURIComponent(urlToFetch)}`);
      
      // FIX 2: Manejo de errores HTTP
      if (!response.ok) {
        const errorText = await response.text();
        // Intenta obtener el detalle del error del backend (FastAPI)
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(`Error: ${errorJson.detail || 'Error desconocido del servidor.'}`);
        } catch (parseError) {
             // Si no es un JSON, muestra el estado y el texto
            throw new Error(`Error HTTP ${response.status}: ${errorText.substring(0, 100)}...`);
        }
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.product_data) {
        // FIX 3: Actualiza la lista de productos después de un éxito.
        setSuccessMessage(`¡Éxito! Producto actualizado. Acción: ${result.action}`);
        await fetchProducts(); 
        
      } else {
        // Esto captura errores lógicos dentro del JSON de respuesta.
        throw new Error(result.message || "La API no devolvió un mensaje de éxito válido.");
      }

    } catch (err) {
      console.error("Fallo al añadir/actualizar producto:", err);
      setError(err.message || "Fallo desconocido al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // Manejador para ver el historial
  const handleViewHistory = async (productTitle) => {
    setSelectedProductTitle(productTitle);
    setLoadingHistory(true);
    setHistoryData([]);
    
    try {
      const response = await fetch(`${REAL_API_URL}/history/${encodeURIComponent(productTitle)}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.history) {
        // Formatear datos para el gráfico
        const formattedHistory = data.history.map(item => ({
          x: new Date(item.timestamp).getTime(), // Timestamp en ms para el gráfico
          y: item.price
        }));
        setHistoryData(formattedHistory);
      } else {
        throw new Error("Formato de historial inesperado.");
      }
      
    } catch (err) {
      setError(`Fallo al cargar el historial: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ====================================================================
  // RENDERIZADO DE LA APLICACIÓN
  // ====================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 flex items-center justify-center">
            <Zap className="w-8 h-8 mr-2 text-yellow-500" />
            Rastreador de Precios M.L.
          </h1>
          <p className="text-gray-500 mt-2">Monitoreo de precios históricos en tiempo real.</p>
          <div className="text-sm text-gray-400 mt-1">
             API Backend: <span className="font-mono text-xs">{REAL_API_URL}</span>
          </div>
        </header>

        {/* Formulario de Búsqueda */}
        <div className="bg-white p-6 shadow-xl rounded-lg mb-8 border border-indigo-100">
          <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              placeholder="Pega la URL completa de Mercado Libre aquí..."
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="submit"
              className={`p-3 rounded-lg text-white font-semibold transition duration-150 flex items-center justify-center 
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Rastreando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Añadir/Actualizar Producto
                </>
              )}
            </button>
          </form>
          
          {/* Mensajes de Estado */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              <span className="font-medium">Éxito:</span> {successMessage}
            </div>
          )}
        </div>

        {/* Listado de Productos */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Productos Rastreando ({products.length})</h2>

        {loading && products.length === 0 && (
            <div className="text-center p-12 bg-white rounded-lg shadow-md">
                <RefreshCw className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
        )}
        
        {!loading && products.length === 0 && !error && (
            <div className="text-center p-12 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
                <p className="mt-4 text-gray-600">¡Aún no hay productos rastreados!</p>
                <p className="text-sm text-gray-400">Pega una URL de Mercado Libre arriba para empezar.</p>
            </div>
        )}

        <div className="space-y-4">
          {products.map((product) => (
            <ProductCard 
              key={product.url} 
              product={product} 
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      </div>
      
      {/* Modal/Ventana de Historial de Precios */}
      {selectedProductTitle && (
        <HistoryModal 
          productTitle={selectedProductTitle} 
          onClose={() => setSelectedProductTitle(null)} 
          historyData={historyData}
          loading={loadingHistory}
        />
      )}
    </div>
  );
};

// ====================================================================
// COMPONENTES AUXILIARES
// ====================================================================

/**
 * Componente de Gráfico de Líneas Simple usando SVG nativo.
 * Reemplaza a react-apexcharts para evitar el error de compilación.
 */
const SimplePriceChart = ({ data, loading }) => {
  if (loading) return null;

  if (data.length < 2) {
    return (
      <div className="text-center p-10 bg-gray-50 rounded-lg">
        No hay suficientes puntos de datos (mínimo 2) para mostrar el gráfico.
      </div>
    );
  }

  // Dimensiones y configuración
  const padding = 20;
  const height = 300;
  const width = 800; // Ancho fijo para el cálculo de puntos
  
  // Extraer valores para normalización
  const prices = data.map(item => item.y);
  const dates = data.map(item => item.x);
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  
  // Margen extra para los ejes Y y X
  const priceRange = maxPrice === minPrice ? 1 : maxPrice - minPrice;
  const dateRange = maxDate - minDate;

  // Funciones de mapeo de coordenadas
  const getX = (date) => padding + ((date - minDate) / dateRange) * (width - 2 * padding);
  const getY = (price) => height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding);
  
  // Generar path para la línea SVG
  const pathData = data.map((item, index) => {
    const x = getX(item.x);
    const y = getY(item.y);
    return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');
  
  const firstDateFormatted = formatTimestamp(new Date(minDate).toISOString()).split(',')[0];
  const lastDateFormatted = formatTimestamp(new Date(maxDate).toISOString()).split(',')[0];

  return (
    <div className="w-full overflow-x-auto border rounded-lg shadow-inner bg-white">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{minWidth: '600px'}}>
        
        {/* Ejes X y Y */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />

        {/* Línea del Precio */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="#4F46E5" // Color Indigo
          strokeWidth="2"
        />
        
        {/* Puntos de Datos */}
        {data.map((item, index) => (
          <circle 
            key={index}
            cx={getX(item.x)}
            cy={getY(item.y)}
            r="4" 
            fill="#4F46E5"
            stroke="#fff"
            strokeWidth="1.5"
          >
            {/* Tooltip básico */}
            <title>Precio: ${item.y.toFixed(2)} - Fecha: {formatTimestamp(new Date(item.x).toISOString())}</title>
          </circle>
        ))}

        {/* Etiquetas de Y (Max/Min Price) */}
        <text x={padding - 5} y={padding + 5} textAnchor="end" fontSize="12" fill="#374151" fontWeight="bold">${maxPrice.toFixed(2)}</text>
        <text x={padding - 5} y={height - padding - 5} textAnchor="end" fontSize="12" fill="#374151">${minPrice.toFixed(2)}</text>
        
        {/* Etiquetas de X (First/Last Date) */}
        <text x={padding} y={height - padding + 18} textAnchor="start" fontSize="10" fill="#6b7280">
          {firstDateFormatted}
        </text>
        <text x={width - padding} y={height - padding + 18} textAnchor="end" fontSize="10" fill="#6b7280">
          {lastDateFormatted}
        </text>

      </svg>
    </div>
  );
};


const ProductCard = ({ product, onViewHistory }) => {
  let statusIcon;
  let statusColor;
  let statusText;
  
  // Lógica de Estado
  switch (product.status) {
    case 'up':
      statusIcon = TrendingUp;
      statusColor = 'text-red-500 bg-red-100';
      statusText = `Subió ${product.change_percentage}`;
      break;
    case 'down':
      statusIcon = TrendingDown;
      statusColor = 'text-green-500 bg-green-100';
      statusText = `Bajó ${product.change_percentage}`;
      break;
    case 'same':
      statusIcon = Clock;
      statusColor = 'text-gray-500 bg-gray-100';
      statusText = 'Sin cambios';
      break;
    default: // new
      statusIcon = Zap;
      statusColor = 'text-blue-500 bg-blue-100';
      statusText = 'Nuevo producto';
  }
  
  const Icon = statusIcon;
  
  return (
    <div className="bg-white p-4 shadow-lg rounded-xl flex flex-col sm:flex-row items-start transition duration-300 hover:shadow-xl border-t-4 border-indigo-400">
      
      {/* Imagen */}
      <img 
        src={product.image || "https://via.placeholder.com/220x220?text=No+Image"} 
        alt={product.title} 
        className="w-full sm:w-24 h-24 object-contain rounded-md mb-4 sm:mb-0 sm:mr-4 border"
        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/220x220?text=No+Image"; }}
      />
      
      {/* Información del Producto */}
      <div className="flex-grow">
        <a href={product.url} target="_blank" rel="noopener noreferrer" 
           className="text-lg font-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2">
          {product.title}
        </a>
        <div className="text-sm text-gray-500 mb-2">{product.store}</div>
        
        {/* Métricas */}
        <div className="flex flex-wrap gap-4 text-sm mt-3">
          <Metric label="Precio Actual" value={product.price} color="text-indigo-600" />
          <Metric label="Precio Mínimo Histórico" value={product.min_historical_price} color="text-green-600" />
          <Metric label="Precio Anterior" value={product.previous_price || "N/A"} color="text-gray-500" />
        </div>
      </div>
      
      {/* Estado y Acciones */}
      <div className="sm:w-48 flex flex-col items-start sm:items-end mt-4 sm:mt-0">
        <div className={`flex items-center text-xs font-semibold px-3 py-1 rounded-full ${statusColor} mb-2`}>
          <Icon className="w-3 h-3 mr-1" />
          {statusText}
        </div>
        
        <div className="text-xs text-gray-400 mt-1 mb-3">
            Último rastreo: {formatTimestamp(product.timestamp)}
        </div>
        
        <button
          onClick={() => onViewHistory(product.title)}
          className="px-4 py-2 text-sm font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md"
        >
          Ver Historial
        </button>
        
        {product.alert_type === 'low_historical' && (
             <div className="mt-2 text-xs font-semibold text-white bg-green-500 px-2 py-1 rounded-full shadow-md">
                ¡Precio Mínimo Histórico!
             </div>
        )}
      </div>
    </div>
  );
};

const Metric = ({ label, value, color }) => (
    <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
);

// Componente de Modal para el Gráfico
const HistoryModal = ({ productTitle, onClose, historyData, loading }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
                
                {/* Cabecera del Modal */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-xl">
                    <h3 className="text-xl font-bold text-indigo-700 line-clamp-1">
                        Historial de Precios: {productTitle}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors text-2xl font-light">
                        &times;
                    </button>
                </div>
                
                {/* Contenido del Gráfico */}
                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="min-h-80 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="ml-3 text-gray-600">Cargando datos históricos...</p>
                        </div>
                    ) : (
                        <SimplePriceChart data={historyData} loading={loading} />
                    )}
                </div>

                {/* Pie de página del Modal */}
                <div className="p-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;