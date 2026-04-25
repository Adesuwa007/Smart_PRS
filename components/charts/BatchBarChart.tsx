'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { department: string; avgPRS: number; count: number }[];
}

export default function BatchBarChart({ data }: Props) {
  return (
    <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
      <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-4 border-b-4 border-[#1A1035]/10 pb-4">Department-wise Average PRS</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1035" strokeOpacity={0.1} />
          <XAxis dataKey="department" tick={{ fill: '#1A1035', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: '#1A1035', strokeWidth: 2 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#1A1035', fontSize: 11, fontWeight: 'bold' }} axisLine={{ stroke: '#1A1035', strokeWidth: 2 }} />
          <Tooltip contentStyle={{ background: '#1A1035', border: '2px solid #1A1035', borderRadius: '12px', fontSize: '13px', color: '#F8F7FF', fontWeight: 'bold', boxShadow: '4px 4px 0px #00C9A7' }} itemStyle={{ color: '#00C9A7' }} cursor={{ fill: '#1A1035', opacity: 0.05 }} />
          <Bar dataKey="avgPRS" fill="#00C9A7" stroke="#1A1035" strokeWidth={2} radius={[4, 4, 0, 0]} name="Avg PRS" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
