import { useState, useEffect } from "react";

export const useSearchController = ({
  autocomplete,
  navigate,
  setIsExpanded
}) => {
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const visibleSuggestions = autocomplete.suggestions.slice(0, 5);
  const maxIndex = visibleSuggestions.length; // incluye "ver todos"

  // 🔍 búsqueda
  const handleChange = (val) => {
    setValue(val);
    autocomplete.search(val);
  };

  // 🚀 submit general
  const handleSubmit = () => {
    if (!value.trim()) return;
  
    navigate(`/?q=${encodeURIComponent(value)}`);
  
    setIsExpanded(false);
    setValue(""); // 🔥 esto faltaba
    setActiveIndex(-1); // opcional pero recomendado
  
    autocomplete.setSuggestions([]); // 🔥 limpia resultados
    autocomplete.setHasSearched(false);
  };

  // ⌨️ teclado
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    }

    if (e.key === "Enter") {
      // 👉 "Ver todos"
      if (activeIndex === maxIndex) {
        handleSubmit();
        return;
      }

      // 👉 seleccionar item
      if (activeIndex >= 0) {
        const selected = visibleSuggestions[activeIndex];
        if (selected) {
          navigate(`/?q=${encodeURIComponent(selected.title)}`);
          setIsExpanded(false);
          setValue(selected.title); // 🔥 mejor UX
        }
      } else {
        handleSubmit();
      }
    }

    if (e.key === "Escape") {
      setIsExpanded(false);
      setActiveIndex(-1);
    }
  };

  // 🔄 reset index cuando cambian resultados
  useEffect(() => {
    setActiveIndex(-1);
  }, [autocomplete.suggestions]);

  return {
    value,
    setValue,
    activeIndex,
    setActiveIndex,
    visibleSuggestions,
    handleChange,
    handleKeyDown,
    handleSubmit
  };
};