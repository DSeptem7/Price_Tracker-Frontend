function SearchResultsCount({
    totalDocs,
    loading,
    currentPage
  }) {
    const shouldRender =
      totalDocs > 0 || (loading && currentPage === 1);
  
    if (!shouldRender) return null;
  
    return (
      <div
        style={{
          marginBottom: "15px",
          textAlign: "right",
          minHeight: "24px"
        }}
      >
        <span
          style={{
            color: "var(--text-muted)",
            fontWeight: "600",
            opacity: loading && currentPage === 1 ? 0.6 : 1,
            transition: "opacity 0.2s ease"
          }}
        >
          {loading && currentPage === 1
            ? "Buscando..."
            : `${totalDocs} Productos encontrados`}
        </span>
      </div>
    );
  }
  
  export default SearchResultsCount;