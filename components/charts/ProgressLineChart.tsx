'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { date: string; prs: number }[];
}

export default function ProgressLineChart({ data }: Props) {
  const trend = data.length >= 2 ? data[data.length - 1].prs - data[data.length - 2].prs : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">PRS Progress</h3>
        <span className={`text-sm font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↗' : '↘'} {trend >= 0 ? '+' : ''}{trend} pts
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
          <YAxis domain={[40, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', fontSize: '13px', color: '#E5E7EB' }} />
          <Line type="monotone" dataKey="prs" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 5, strokeWidth: 2, stroke: '#0A0A0F' }} activeDot={{ r: 7, fill: '#06B6D4' }} name="PRS Score" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
