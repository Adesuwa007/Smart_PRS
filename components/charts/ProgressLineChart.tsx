'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { date: string; prs: number; sessionInfo?: string }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: { prs: number; sessionInfo?: string } }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">PRS: <span className="text-cyan-400">{data.prs}</span></p>
        {data.sessionInfo && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-purple-400 font-semibold">{data.sessionInfo}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props: { cx?: number; cy?: number; payload?: { sessionInfo?: string } }) => {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.sessionInfo) {
    return (
      <svg x={cx - 8} y={cy - 8} width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" fill="#A855F7" stroke="#111827" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="#FFFFFF" />
      </svg>
    );
  }
  return <circle cx={cx} cy={cy} r={5} stroke="#0A0A0F" strokeWidth={2} fill="#06B6D4" />;
};

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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line type="monotone" dataKey="prs" stroke="#06B6D4" strokeWidth={3} dot={<CustomDot />} activeDot={{ r: 7, fill: '#06B6D4' }} name="PRS Score" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
