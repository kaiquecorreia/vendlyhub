'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const data = [
  {
    name: '01/25',
    'Ganho capital': 4000,
    'Total aplicado': 2400,
    amt: 2400,
  },
  {
    name: '02/25',
    'Ganho capital': -3000,
    'Total aplicado': 1398,
    amt: 2210,
  },
  {
    name: '03/25',
    'Ganho capital': -2000,
    'Total aplicado': 9800,
    amt: 2290,
  },
  {
    name: '04/25',
    'Ganho capital': 2780,
    'Total aplicado': 3908,
    amt: 2000,
  },
  {
    name: '05/25',
    'Ganho capital': -1890,
    'Total aplicado': 4800,
    amt: 2181,
  },
  {
    name: '06/25',
    'Ganho capital': 3490,
    'Total aplicado': 4300,
    'Extra ganho': 4300,
    amt: 2100,
  },
];

export default function StackedBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        width={500}
        height={300}
        data={data}
        stackOffset="sign"
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Total aplicado" fill="#3b82f6" stackId="stack" />
        <Bar dataKey="Ganho capital" fill="#93c5fd" stackId="stack" radius={[10, 10, 0, 0]} />
        <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}
