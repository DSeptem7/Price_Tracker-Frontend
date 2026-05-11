import { useState, useEffect, useCallback } from "react";

export const useTrackProduct = ({
  API_BASE,
  inputValue,
  setInputValue,
  setSearchParams,
  fetchProducts
}) => {

  const [refreshing, setRefreshing] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState("");
  const [loadingText, setLoadingText] = useState("Iniciando rastreo...");
  const [isExiting, setIsExiting] = useState(false);

  // Mensajes dinámicos
  const loadingMessages = [
    "Conectando...",
    "Extrayendo información...",
    "Analizando precios...",
    "Verificando stock...",
    "¡Casi listo!"
  ];

  // Animación de mensajes
  useEffect(() => {
    let interval;
    if (refreshing) {
      let i = 0;
      setLoadingText(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[i]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [refreshing]);

  // TRACK PRODUCT
  const handleTrackProduct = useCallback(async () => {
    const isUrl =
      inputValue &&
      inputValue.includes("http") &&
      inputValue.includes("mercadolibre.com");
    if (!isUrl) return;

    setRefreshing(true);
    setTrackingMessage("");
    setIsExiting(false);

    try {
      const url = `${API_BASE}/products?url=${encodeURIComponent(inputValue)}`;
      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || "Error desconocido.");
      }

      setTrackingMessage(result.message);
      setInputValue("");
      setSearchParams({});
      await fetchProducts();

      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setTrackingMessage("");
          setIsExiting(false);
        }, 600);

      }, 6000);

    } catch (err) {
      setTrackingMessage(`Error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }

  }, [
    API_BASE,
    inputValue,
    setInputValue,
    setSearchParams,
    fetchProducts
  ]);

  return {
    refreshing,
    trackingMessage,
    loadingText,
    isExiting,
    handleTrackProduct
  };
};