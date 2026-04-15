const API_BASE = import.meta.env.VITE_API_BASE;

export const fetchAutocomplete = async (query) => {
  const res = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(query)}`);
  return res.json();
};