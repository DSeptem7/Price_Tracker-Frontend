import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Intentamos el método tradicional
    window.scrollTo(0, 0);

    // 2. Forzamos al elemento raíz (HTML) y al Body
    // Esto es necesario cuando usamos height: 100% o fill-available
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);

    // 3. Por si acaso, buscamos el contenedor principal de tu App
    const appContainer = document.querySelector('.App');
    if (appContainer) {
      appContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;