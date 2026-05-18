import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forzamos el scroll al inicio (coordenadas 0,0)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
  }, [pathname]); // Se dispara cada vez que la ruta (URL) cambia

  return null; // Este componente no renderiza nada visualmente
};

export default ScrollToTop;