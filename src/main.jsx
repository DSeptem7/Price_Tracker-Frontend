import { BrowserRouter } from 'react-router-dom';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import "./styles/base/animations.css";

const savedTheme = localStorage.getItem("isDarkMode");

if (savedTheme === "true") {
  document.documentElement.classList.add("dark-mode");
} else {
  document.documentElement.classList.remove("dark-mode");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* <--- Abre aquí */}
      <App />
    </BrowserRouter> {/* <--- Cierra aquí */}
  </StrictMode>
);
