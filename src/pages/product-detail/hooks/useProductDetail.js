import { useEffect, useState } from 'react';

export const useProductDetail = (API_BASE, id) => {

  const [product, setProduct] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productRes, chartRes] = await Promise.all([
          fetch(`${API_BASE}/product/${id}`),
          fetch(`${API_BASE}/product/${id}/chart`)
        ]);

        if (!productRes.ok) {
          console.error('Producto no encontrado');
          return;
        }

        const productData = await productRes.json();
        const chartDataResponse = await chartRes.json();
        setProduct(productData);
        setChartData(chartDataResponse.points || []);
      } catch (err) {
        console.error('Error product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE, id]);

  return {
    product,
    chartData,
    loading
  };
};