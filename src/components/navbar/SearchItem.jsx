import React, { useMemo, useEffect, useRef } from 'react';
import { highlightMatch } from './search/highlightMatch';

const SearchItem = ({ title, query, onClick, isActive }) => {

  const ref = useRef(null);
  const href = `/?q=${encodeURIComponent(title)}`;

  const highlightedTitle = useMemo(() => {
    return highlightMatch(title, query);
  }, [title, query]);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({
        block: "nearest"
      });
    }
  }, [isActive]);

  return (
    <a
      ref={ref}
      href={href}
      className={`search-result-item ${isActive ? 'active' : ''}`}
      role="option"
      aria-selected={isActive}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.button === 1) return;
        e.preventDefault();
        onClick(); // tu navigate actual
      }}
    >
      <div className="search-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      <span className="mini-title">
        {highlightedTitle}
      </span>
    </a>
  );
};

export default SearchItem;