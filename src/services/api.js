const API_BASE = import.meta.env.VITE_API_BASE;

export const fetchAutocomplete = async (query) => {
    const url = `${API_BASE}/autocomplete?q=${encodeURIComponent(query)}`;
  
    console.log("🔍 URL:", url);
  
    const res = await fetch(url);
  
    console.log("🔍 STATUS:", res.status);
  
    const text = await res.text();
    console.log("🔍 RESPONSE RAW:", text.slice(0, 200)); // solo preview
  
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("❌ No es JSON válido");
      throw e;
    }
  };