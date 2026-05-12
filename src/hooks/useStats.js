import { useEffect, useState, useCallback } from "react";

export function useStats(API_BASE) {
  const [stats, setStats] = useState({
    dropCount: 0,
    upCount: 0,
    totalSavings: 0,
    bestDiscount: {
      percent: 0,
      title: ""
    }
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/global`);
      const data = await res.json();

      setStats({
        dropCount: data.dropCount,
        upCount: data.upCount,
        totalSavings: data.totalSavings,
        bestDiscount: data.bestDiscount
      });

    } catch (err) {
      console.error("Error stats:", err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    fetchStats
  };
}