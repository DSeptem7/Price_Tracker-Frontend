// Utilería Profesional de Formato
// Maneja nulos, ceros y tipos de dato incorrectos sin romper la app
const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    
    // Aseguramos que sea número
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return '$0.00';
  
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(num);
  };
  
  const formatPercentage = (value) => {
      if (value === null || value === undefined) return '0%';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return `${num.toFixed(2)}%`; // Agregamos el % visualmente aquí
  };