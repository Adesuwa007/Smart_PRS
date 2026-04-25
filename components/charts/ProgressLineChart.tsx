'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { date: string; prs: number; sessionInfo?: string }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: { prs: number; sessionInfo?: string } }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-4 border-[#1A1035] p-3 rounded-xl shadow-[4px_4px_0px_#1A1035]">
        <p className="text-[#1A1035]/60 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[#1A1035] font-black text-sm">PRS: <span className="text-[#00C9A7] text-lg">{data.prs}</span></p>
        {data.sessionInfo && (
          <div className="mt-2 pt-2 border-t-4 border-[#1A1035]/10">
            <p className="text-xs text-[#6C47FF] font-black">{data.sessionInfo}</p>
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
        <circle cx="12" cy="12" r="10" fill="#6C47FF" stroke="#1A1035" strokeWidth="3" />
        <circle cx="12" cy="12" r="4" fill="#FFFFFF" />
      </svg>
    );
  }
  return <circle cx={cx} cy={cy} r={6} stroke="#1A1035" strokeWidth={3} fill="#00C9A7" />;
};

export default function ProgressLineChart({ data }: Props) {
  const trend = data.length >= 2 ? data[data.length - 1].prs - data[data.length - 2].prs : 0;

  return (
    <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
      <div className="flex items-center justify-between mb-4 border-b-4 border-[#1A1035]/10 pb-4">
        <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight">PRS Progress</h3>
        <span className={`text-sm font-black px-2 py-1 rounded border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] ${trend >= 0 ? 'bg-[#00C9A7] text-[#1A1035]' : 'bg-[#FF4D6D] text-white'}`}>
          {trend >= 0 ? '↗' : '↘'} {trend >= 0 ? '+' : ''}{trend} pts
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1035" strokeOpacity={0.1} />
          <XAxis dataKey="date" tick={{ fill: '#1A1035', fontSize: 11, fontWeight: 'bold' }} axisLine={{ stroke: '#1A1035', strokeWidth: 2 }} />
          <YAxis domain={[40, 100]} tick={{ fill: '#1A1035', fontSize: 11, fontWeight: 'bold' }} axisLine={{ stroke: '#1A1035', strokeWidth: 2 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1A1035', strokeWidth: 2, strokeDasharray: '4 4' }} />
          <Line type="monotone" dataKey="prs" stroke="#00C9A7" strokeWidth={4} dot={<CustomDot />} activeDot={{ r: 8, fill: '#6C47FF', stroke: '#1A1035', strokeWidth: 3 }} name="PRS Score" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
