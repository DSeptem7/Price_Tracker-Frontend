import React from 'react';
import './Footer.css'; // Ahora crearemos este archivo

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-section brand">
          <h2 className="footer-logo">
            <span className="cart-icon">🛒</span> Price Tracker
          </h2>
          <p>Tu aliado inteligente para compras estratégicas en México.</p>
        </div>

        <div className="footer-section links">
          <h4>Plataformas</h4>
          <ul>
            <li><a href="https://www.mercadolibre.com.mx" target="_blank" rel="noreferrer">Mercado Libre</a></li>
            <li><a href="https://www.amazon.com.mx" target="_blank" rel="noreferrer">Amazon</a></li>
          </ul>
        </div>

        <div className="footer-section status">
          <h4>Sistema</h4>
          <div className="status-item">
            <span className="status-dot"></span>
            <span>Servidores Activos</span>
          </div>
          <p className="update-text">Actualizaciones en tiempo real</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Price Tracker - Análisis de Precios. Todos los derechos reservados.</p>
        <div className="footer-bottom-links">
          <span>Hecho con amor para compradores</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;