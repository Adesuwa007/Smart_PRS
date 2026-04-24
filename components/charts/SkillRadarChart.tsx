'use client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  studentScores: { aptitude: number; coding: number; core_subjects: number; soft_skills: number; attendance: number };
  batchAverage: { aptitude: number; coding: number; core_subjects: number; soft_skills: number; attendance: number };
}

export default function SkillRadarChart({ studentScores, batchAverage }: Props) {
  const data = [
    { subject: 'Aptitude', student: studentScores.aptitude, batch: batchAverage.aptitude },
    { subject: 'Coding', student: studentScores.coding, batch: batchAverage.coding },
    { subject: 'Core Subjects', student: studentScores.core_subjects, batch: batchAverage.core_subjects },
    { subject: 'Soft Skills', student: studentScores.soft_skills, batch: batchAverage.soft_skills },
    { subject: 'Attendance', student: studentScores.attendance, batch: batchAverage.attendance },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-base font-semibold text-white mb-4">Skill Radar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#1F2937" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} />
          <Radar name="You" dataKey="student" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} strokeWidth={2} />
          <Radar name="Batch Avg" dataKey="batch" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
