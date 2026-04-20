import React, { useRef, useEffect } from "react";
import SearchDropdown from "./SearchDropdown";
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [autocomplete, setIsExpanded]);

  return (
    <div ref={searchRef} className={`search-box ${isExpanded ? "expanded" : ""}`}>
      
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