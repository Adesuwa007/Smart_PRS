'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { department: string; avgPRS: number; count: number }[];
}

export default function BatchBarChart({ data }: Props) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold text-white mb-4">Department-wise Average PRS</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="department" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#1F2937' }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={{ stroke: '#1F2937' }} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', fontSize: '13px', color: '#E5E7EB' }} />
          <Bar dataKey="avgPRS" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Avg PRS" />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
