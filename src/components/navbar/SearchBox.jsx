import React, { useRef, useEffect } from 'react';
import SearchDropdown from './SearchDropdown';

const SearchBox = ({
  value,
  setValue,
  isExpanded,
  setIsExpanded,
  autocomplete,
  navigate
}) => {
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    autocomplete.search(val);
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    navigate(`/?q=${encodeURIComponent(value)}`);
    setIsExpanded(false);
    setValue("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsExpanded(false);
        autocomplete.setSuggestions([]);
        autocomplete.setHasSearched(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`search-box ${isExpanded ? 'expanded' : ''}`}>

      <input
        ref={inputRef}
        className="search-input"
        value={value}
        onChange={handleChange}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Buscar productos..."
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
        <button className="search-btn"
                onClick={() => {
                    if (!isExpanded) {
                    setIsExpanded(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    } else {
                    if (value.trim()) {
                        handleSubmit();
                    } else {
                        setIsExpanded(false);
                    }
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
        suggestions={autocomplete.suggestions}
        hasSearched={autocomplete.hasSearched}
        onSelect={(title) => {
          navigate(`/?q=${encodeURIComponent(title)}`);
          setIsExpanded(false);
          setValue("");
        }}
        onSubmit={handleSubmit}
      />

    </div>
  );
};

export default SearchBox;