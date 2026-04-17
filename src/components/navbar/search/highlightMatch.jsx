import React from "react";

export const highlightMatch = (text, query) => {
    if (!query || !text) return text;
  
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length === 0) return text;
  
    const escapedWords = words.map(w =>
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
  
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
    const parts = text.split(regex);
  
    return parts.map((part, i) => {
      const isMatch = words.some(
        word => part.toLowerCase() === word.toLowerCase()
      );
  
      return isMatch ? (
        <mark key={i} className="highlight">{part}</mark>
      ) : part;
    });
  };