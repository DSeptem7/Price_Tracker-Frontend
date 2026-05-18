import React from 'react';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';

import { formatCurrency } from '../../../utils/format';

const PriceHistoryChart = ({
  filteredData,
  product,
  isDarkMode,
  isChanging
}) => {

  if (!product || !product.history) return null;

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      style={{ outline: 'none' }}
    >
      <AreaChart
        data={filteredData}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 20
        }}
      >
        <defs>
          <linearGradient
            id="colorPrice"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stopColor="#3b82f6"
              stopOpacity={0.3}
            />

            <stop
              offset="95%"
              stopColor="#3b82f6"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <YAxis
          domain={['auto', 'auto']}
          stroke={isDarkMode ? "#94a3b8" : "#64748b"}
          tickFormatter={(v) => formatCurrency(v)}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />

        <XAxis
          dataKey="timestamp"
          stroke={isDarkMode ? "#94a3b8" : "#64748b"}
          fontSize={10}
          tickFormatter={(str) => str?.split(' ')[0]}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={isDarkMode ? "#334155" : "#e2e8f0"}
        />

        {!product.is_new &&
          typeof product.baseline_price === "number" &&
          product.baseline_price > 0 && (
            <ReferenceLine
              y={product.baseline_price}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={2}
            >
              <Label
                value="Precio Mercado (30d)"
                position="insideBottomRight"
                fill="#94a3b8"
                fontSize={10}
                dy={-5}
              />
            </ReferenceLine>
          )}

        <Tooltip
          contentStyle={{
            backgroundColor: isDarkMode
              ? 'rgba(30, 41, 59, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',

            border: 'none',
            borderRadius: '8px'
          }}

          formatter={(v) => [
            formatCurrency(v),
            'Precio'
          ]}
        />

        <Area
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          fillOpacity={isChanging ? 0.1 : 1}
          fill="url(#colorPrice)"
          strokeWidth={3}
          animationDuration={500}
        />

      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PriceHistoryChart;