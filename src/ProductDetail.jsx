import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductDetail = ({ API_BASE, isDarkMode }) => {
  const { id } = useParams(); // Aquí llega el ID que pusimos en el link
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // 1. Aquí irá la lógica para subir la PRIORIDAD en Supabase
    // 2. Aquí buscaremos los datos del producto
    const fetchProductData = async () => {
      try {
        const response = await fetch(`${API_BASE}/product/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error cargando producto:", error);
      }
    };

    fetchProductData();
  }, [id, API_BASE]);

  if (!product) return <div className="loading-screen">Cargando detalles del producto...</div>;

  return (
    <div className={`detail-container ${isDarkMode ? 'dark' : 'light'}`}>
      <button onClick={() => navigate('/')} className="btn-back">← Volver</button>
      <header>
        <h1>{product.title}</h1>
        <span className="badge-id">ID: {id}</span>
      </header>
      {/* Aquí diseñaremos la nueva gráfica y los datos extra */}
    </div>
  );
};

export default ProductDetail;