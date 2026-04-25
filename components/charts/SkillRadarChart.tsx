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
    <div className="bg-white border-4 border-[#1A1035] p-6 rounded-2xl shadow-[6px_6px_0px_#1A1035]">
      <h3 className="text-lg font-black text-[#1A1035] uppercase tracking-tight mb-4">Skill Radar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#1A1035" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1035', fontSize: 11, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#1A1035', fontSize: 10, fontWeight: 'bold' }} axisLine={false} />
          <Radar name="You" dataKey="student" stroke="#00C9A7" fill="#00C9A7" fillOpacity={0.5} strokeWidth={3} />
          <Radar name="Batch Avg" dataKey="batch" stroke="#6C47FF" fill="#6C47FF" fillOpacity={0.2} strokeWidth={2} strokeDasharray="4 4" />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#1A1035', fontWeight: 'bold' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
