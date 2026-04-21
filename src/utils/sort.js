 // --- MAPEO PARA FILTROS L.433 ---
 export const mapSortOption = useCallback((opt) => {
    switch (opt) {
      case "date_desc": return "latest";
      case "date_asc": return "oldest";
      case "price_desc": return "price_high";
      case "price_asc": return "price_low";
      default: return "latest";
    }
  }, []); 