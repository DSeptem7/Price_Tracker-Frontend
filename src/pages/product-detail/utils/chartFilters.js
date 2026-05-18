export const getFilteredChartData = (chartData, timeRange) => {
    if (!chartData || chartData.length === 0) return [];
  
    if (timeRange === 'all') return chartData;
  
    const now = new Date();
    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    };
  
    const daysLimit = ranges[timeRange];
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - daysLimit);
    cutoffDate.setHours(0, 0, 0, 0);
  
    return chartData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= cutoffDate;
    });
  };