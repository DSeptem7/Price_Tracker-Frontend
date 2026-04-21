// --- HIGHLIGHTER ROBUSTO (Evita crashes con Regex) ---
export const highlightText = (text, query) => {
    if (!text || typeof text !== 'string') return "";
    if (!query || typeof query !== 'string') return text;
    if (query.includes("http") || query.includes(".com")) return text;
  
    const normalize = (str) => {
      try {
        return str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      } catch {
        return "";
      }
    };
  
    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);
  
    if (!normalizedQuery) return text;
  
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return text;
  
    let result = [];
    let currentIndex = 0;
  
    tokens.forEach(token => {
      let index = normalizedText.indexOf(token, currentIndex);
  
      while (index !== -1) {
        // texto antes del match
        if (index > currentIndex) {
          result.push(text.slice(currentIndex, index));
        }
  
        // match (usando posiciones reales del texto original)
        const matchText = text.slice(index, index + token.length);
  
        result.push(
          <mark key={`${index}-${token}`} className="highlight">
            {matchText}
          </mark>
        );
  
        currentIndex = index + token.length;
        index = normalizedText.indexOf(token, currentIndex);
      }
    });
  
    // resto del texto
    if (currentIndex < text.length) {
      result.push(text.slice(currentIndex));
    }
  
    return <>{result}</>;
  };