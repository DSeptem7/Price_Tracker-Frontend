import React from 'react';

const ranges = ['1m', '3m', '6m', '1y', 'all'];

const RangeSelector = ({
  timeRange,
  handleRangeChange,
  className = ''
}) => {

  return (
    <div className={`range-selector ${className}`}>
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => handleRangeChange(range)}
          className={`range-btn ${
            timeRange === range ? 'active' : ''
          }`}
        >
          {range === 'all'
            ? 'Todo'
            : range.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default RangeSelector;