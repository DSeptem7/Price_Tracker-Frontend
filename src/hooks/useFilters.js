import { useState } from "react";

export function useFilters(setSearchParams, setInputValue, setCurrentPage) {
  const [sortOption, setSortOption] = useState("date_desc");
  const [filterOption, setFilterOption] = useState("available");

  const handleResetAll = () => {
    setSearchParams({});
    setInputValue("");

    setFilterOption("available");
    setSortOption("date_desc");

    setCurrentPage(1);
  };

  return {
    sortOption,
    setSortOption,
    filterOption,
    setFilterOption,
    handleResetAll
  };
}