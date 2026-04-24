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
      <div className="prs-gauge prs-gauge-premium" style={{ width: size, height: size }}>
        <div className="prs-gauge-glow-ring" style={{ boxShadow: `0 0 45px ${color}55, inset 0 0 35px ${color}22` }} />
        <span className="particle particle-score" style={{ top: '12%', left: '18%', animationDelay: '0s' }} />
        <span className="particle particle-score" style={{ top: '78%', left: '15%', animationDelay: '1.2s' }} />
        <span className="particle particle-score" style={{ top: '22%', right: '12%', animationDelay: '2s' }} />
        <span className="particle particle-score" style={{ top: '68%', right: '10%', animationDelay: '2.8s' }} />
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1a24" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="prs-gauge-circle prs-gauge-draw" style={{ filter: `drop-shadow(0 0 12px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{Math.round(animated)}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="mt-3 text-xs font-semibold badge score-status-badge" style={{ color, borderColor: `${color}88`, background: `${color}1f` }}>
        {label}
      </span>
    </div>
  );
}
