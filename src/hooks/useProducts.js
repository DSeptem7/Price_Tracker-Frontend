import { useState, useEffect, useCallback } from "react";
import { mapSortOption } from "../utils/sort";

export const useProducts = ({
  API_BASE,
  currentPage,
  itemsPerPage,
  urlQuery,
  sortOption,
  filterOption,
  setRefreshing // 👈 opcional pero útil
}) => {

  const [products, setProducts] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🚀 FETCH
  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sort_by: mapSortOption(sortOption),
        filter_opt: filterOption
      });

      if (urlQuery) params.append("search", urlQuery);

      const res = await fetch(`${API_BASE}/product_history?${params.toString()}`);
      const data = await res.json();

      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalDocs(data.total);
      } else {
        setProducts([]);
        setTotalDocs(0);
      }

    } catch (err) {
      console.error("Error de conexión:", err);
      setProducts([]);
      setTotalDocs(0);
    } finally {
      setLoading(false);
      setRefreshing?.(false); // 👈 solo si existe
    }
  }, [API_BASE, currentPage, itemsPerPage, urlQuery, sortOption, filterOption, mapSortOption, setRefreshing]);

  // 🔄 AUTO FETCH
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 📄 PAGINACIÓN
  const totalPages = Math.ceil(totalDocs / itemsPerPage);

  const getPaginationGroup = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (currentPage <= 4)
      return [1, 2, 3, 4, 5, "...", totalPages];

    if (currentPage >= totalPages - 3)
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return {
    products,
    totalDocs,
    loading,
    totalPages,
    getPaginationGroup,
    fetchProducts // 👈 IMPORTANTE (para trackProduct)
  };
};