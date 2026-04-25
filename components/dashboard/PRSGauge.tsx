'use client';
import { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
}

export default function PRSGauge({ score, size = 160 }: Props) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  const color = score >= 75 ? '#06B6D4' : score >= 50 ? '#8B5CF6' : '#EF4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Average' : 'At Risk';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(26,16,53,0.1)" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-[#1A1035]">{Math.round(animated)}</span>
          <span className="text-[10px] font-bold text-[#1A1035]/40 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className="mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] bg-white" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
