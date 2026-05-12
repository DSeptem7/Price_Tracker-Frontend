import { useEffect, useState } from "react";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("isDarkMode");

      return savedTheme !== null
        ? savedTheme === "true"
        : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode);

    const root = document.documentElement;

    root.classList.toggle("dark-mode", isDarkMode);
    root.classList.toggle("light-mode", !isDarkMode);
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode
  };
}