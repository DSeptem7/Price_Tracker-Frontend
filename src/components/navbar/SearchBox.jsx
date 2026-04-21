import React, { useRef, useEffect } from 'react';
import SearchDropdown from './SearchDropdown';
import { useSearchController } from "./hooks/useSearchController";

const SearchBox = ({
  isExpanded,
  setIsExpanded,
  autocomplete,
  navigate
}) => {
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const {
    value,
    setValue,
    activeIndex,
    visibleSuggestions,
    handleChange,
    handleKeyDown,
    handleSubmit
  } = useSearchController({
    autocomplete,
    navigate,
    setIsExpanded
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!searchRef.current) return;
  
      if (!searchRef.current.contains(e.target)) {
        setIsExpanded(false);
        autocomplete.setSuggestions([]);
        autocomplete.setHasSearched(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [autocomplete, setIsExpanded]);

  return (
    <div ref={searchRef} className={`search-box ${isExpanded ? 'expanded' : ''}`}>

      <input
        ref={inputRef}
        className="search-input"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onClick={() => setIsExpanded(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar productos..."
        role="combobox"
        aria-expanded={isExpanded}
        aria-controls="search-dropdown"
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
        }
      />

        {isExpanded && value && (
        <button 
            className="clear-search-x"
            onClick={() => {
            setValue("");
            autocomplete.setSuggestions([]);
            autocomplete.setHasSearched(false);
            inputRef.current?.focus();
            }}
            type="button"
        >
            ✕
        </button>
        )}
        <button
                className="search-btn"
                onClick={() => {
                  if (value.trim()) {
                    handleSubmit();
                  } else {
                    setIsExpanded(prev => !prev);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }
                }}
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <SearchDropdown
        isOpen={isExpanded}
        query={value}
        isLoading={autocomplete.isLoading}
        suggestions={visibleSuggestions}
        totalSuggestions={autocomplete.suggestions.length}
        hasSearched={autocomplete.hasSearched}
        activeIndex={activeIndex}
        onSubmit={handleSubmit}
      />

    </div>
  );
};

export default SearchBox;
