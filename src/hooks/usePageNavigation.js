import { useState } from "react";

export function usePageNavigation() {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 100,
      behavior: "smooth"
    });
  };

  return {
    currentPage,
    setCurrentPage,
    handlePageChange
  };
}