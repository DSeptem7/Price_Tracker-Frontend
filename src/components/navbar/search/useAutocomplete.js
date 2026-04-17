import { useState, useRef } from 'react';

export const useAutocomplete = (API_BASE) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const abortRef = useRef(null);

  const search = (value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        // 🔥 CANCELAR request anterior
        if (abortRef.current) {
          abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        // 🔥 loading inteligente
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(true);
        }, 150);

        setHasSearched(false);

        const res = await fetch(
          `${API_BASE}/autocomplete?q=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );

        const data = await res.json();

        setSuggestions(Array.isArray(data) ? data : data.suggestions || []);
        setHasSearched(true);

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Autocomplete error:", err);
        }
      } finally {
        clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
      }
    }, 300);
  };

  return {
    suggestions,
    isLoading,
    hasSearched,
    search,
    setSuggestions,
    setHasSearched
  };
};