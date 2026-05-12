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

    document.body.classList.toggle("dark-mode", isDarkMode);
    document.body.classList.toggle("light-mode", !isDarkMode);
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode
  };
}