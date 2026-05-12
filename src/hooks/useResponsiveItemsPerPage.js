import { useEffect, useState } from "react";

export function useResponsiveItemsPerPage() {
  const getItemsPerPage = () => {
    return window.innerWidth < 600 ? 8 : 20;
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return itemsPerPage;
}