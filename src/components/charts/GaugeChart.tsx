'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GaugeChart({
  value,
  max = 100,
  label,
  sublabel,
  color = '#166534',
  size = 'md',
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  const dimensions = {
    sm: { width: 120, height: 80, innerRadius: 35, outerRadius: 45, fontSize: 'text-lg' },
    md: { width: 180, height: 110, innerRadius: 55, outerRadius: 70, fontSize: 'text-2xl' },
    lg: { width: 240, height: 140, innerRadius: 75, outerRadius: 95, fontSize: 'text-3xl' },
  };

  const { width, height, innerRadius, outerRadius, fontSize } = dimensions[size];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width, height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#334155" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={`font-bold text-white ${fontSize}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="font-medium text-slate-200">{label}</p>
        {sublabel && <p className="text-sm text-slate-400">{sublabel}</p>}
      </div>
    </div>
  );
}
