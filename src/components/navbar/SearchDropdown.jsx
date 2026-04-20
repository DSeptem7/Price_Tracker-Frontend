import React from 'react';
import SearchItem from './SearchItem';

const SearchDropdown = (props) => {
  const {
    isOpen,
    query,
    isLoading,
    suggestions,
    hasSearched,
    onSelect,
    onSubmit,
    activeIndex
  } = props;
  if (!isOpen || query.trim().length < 2) return null;
  if (!Array.isArray(suggestions)) return null;

  return (
    <div
      id="search-dropdown"
      className="live-search-results"
      role="listbox"
    >
      {/* LOADING */}
      {isLoading && (
        <div className="search-result-item">
          <div className="search-icon spinner">
            <svg width="18" height="18" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4"/>
            </svg>
          </div>
          <div className="mini-info">
            <span className="mini-title">Buscando...</span>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {!isLoading && suggestions.length > 0 && (
        <>
          {suggestions.slice(0, 5).map((s, i) => (
            <SearchItem
              key={i}
              title={s.title}
              query={query}
              isActive={i === activeIndex}
              onClick={() => onSelect(s.title)}
            />
          ))}

          <div
            className={`view-all-results ${activeIndex === suggestions.length ? 'active' : ''}`}
            onClick={onSubmit}
            role="option"
            aria-selected={activeIndex === suggestions.length}
          >
            Ver todos los resultados para "{query}"
          </div>
        </>
      )}

      {/* EMPTY */}
      {!isLoading && hasSearched && suggestions.length === 0 && (
        <div className="no-results-live">
                    
        <div className="no-results-icon-mini">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>

        <p>No encontramos coincidencias</p>
        <span className="search-tip">
          Intenta otra búsqueda o presiona Enter
        </span>

          <div
              className="view-all-results"
              onClick={onSubmit}
              role="option"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmit();
                }
              }}
            >
            Buscar: "{query}"
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchDropdown;
