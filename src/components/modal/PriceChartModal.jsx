import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/format";
import "../../styles/modal/price-chart-modal.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PriceChartModal = ({
  productTitle,
  onClose,
  apiBase,
  isDarkMode
}) => {

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDarkMode ? "#f1f5f9" : "#333";

  const gridColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "#ccc";

  useEffect(() => {

    const fetchHistory = async () => {

      try {

        setLoading(true);

        const safeKeyTitle = productTitle
          .trim()
          .replace(/\s+/g, " ")
          .replace(/[/\\+]/g, "_");

        const url = `${apiBase}/history/${encodeURIComponent(safeKeyTitle)}`;

        const res = await fetch(url);

        if (res.status === 404) {
          setHistory([]);
          return;
        }

        const data = await res.json();

        if (data && Array.isArray(data.history)) {

          const formattedData = data.history
            .map((item) => {

              const priceValue =
                typeof item.price === "number"
                  ? item.price
                  : parseFloat(item.price);

              if (isNaN(priceValue) || priceValue <= 0) {
                return null;
              }

              return {
                price: priceValue,
                date: new Date(item.timestamp).toLocaleString(
                  "es-MX",
                  {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
              };

            })
            .filter(Boolean);

          setHistory(formattedData);

        } else {

          setHistory([]);

        }

      } catch (err) {

        console.error("Error al obtener historial:", err);

      } finally {

        setLoading(false);

      }

    };

    fetchHistory();

  }, [productTitle, apiBase]);

  return (

    <div
      className="modal-backdrop"
      onClick={onClose}
    >

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="close-button"
          onClick={onClose}
        >
          &times;
        </button>

        <h3
          style={{
            color: textColor,
            marginTop: "20px",
            marginBottom: "20px"
          }}
        >
          Historial: {productTitle}
        </h3>

        {loading ? (

          <p style={{ color: textColor }}>
            Cargando historial...
          </p>

        ) : history.length > 1 ? (

          <div
            style={{
              width: "100%",
              height: 300,
              paddingRight: "20px",
              outline: "none",
            }}
          >

            <ResponsiveContainer>

              <LineChart data={history}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: textColor,
                    fontSize: 12
                  }}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{
                    fill: textColor,
                    fontSize: 12
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode
                      ? "rgba(30, 41, 59, 0.9)"
                      : "rgba(255, 255, 255, 0.9)",

                    color: textColor,

                    border: `1px solid ${gridColor}`,

                    borderRadius: "8px",
                  }}

                  formatter={(value) => [
                    formatCurrency(value),
                    "Precio"
                  ]}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={
                    isDarkMode
                      ? "#3b82f6"
                      : "#8884d8"
                  }
                  dot={false}
                  strokeWidth={2}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <p style={{ color: textColor }}>
            No hay suficiente historial para mostrar una gráfica.
          </p>

        )}

      </div>

    </div>
  );
};

export default PriceChartModal;