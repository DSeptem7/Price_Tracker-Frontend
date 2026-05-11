import { useEffect } from "react";

export const useSearchSync = ({
  inputValue,
  setInputValue,
  urlQuery,
  setSearchParams,
  setCurrentPage
}) => {

  // Sync URL -> input
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery, setInputValue]);

  // Sync input -> URL
  useEffect(() => {
    const val = inputValue;
    const isUrl =
      val.includes("http") ||
      val.includes(".com");

    // Evitar búsquedas cuando es URL
    // o cuando no hubo cambios
    if (isUrl || val === urlQuery) return;

    const timer = setTimeout(() => {
      setCurrentPage(1);

      if (val.trim() === "") {
        setSearchParams({});
      } else {
        setSearchParams({ q: val });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    inputValue,
    urlQuery,
    setSearchParams,
    setCurrentPage
  ]);

};