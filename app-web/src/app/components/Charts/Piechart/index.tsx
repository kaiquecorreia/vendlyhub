'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import renderActiveShape from './renderActiveShape';

const COLORS = ['#3b82f6', '#60a5fa', '#38bdf8', '#22c55e', '#f59e0b', '#94a3b8'];

type ChartData = {
  name: string;
  value: number;
};

interface DonutChartProps {
  data: ChartData[];
}

export default function DonutChart({ data }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={150}
          dataKey="value"
          activeIndex={activeIndex ?? -1}
          activeShape={renderActiveShape}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          stroke="none"
          isAnimationActive
          animationBegin={300}
          animationDuration={1500}
          animationEasing="ease-in-out"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  );
}
