// ============================================================================
// SmartPRS — AI Readiness Engine
// Rule-based weighted scoring — runs entirely client-side
// ============================================================================

import { StudentScores, PRSResult, WeakArea, Recommendation } from '@/types';

// ---------------------------------------------------------------------------
// PRS Score Calculation
// ---------------------------------------------------------------------------
export function calculatePRS(scores: StudentScores): number {
  const attendanceMultiplier = scores.attendance >= 75 ? 1.0 : 0.85;
  const backlogPenalty = scores.backlogs === 0 ? 1.0 : scores.backlogs === 1 ? 0.92 : 0.80;

  const raw =
    scores.aptitude * 0.25 +
    scores.coding * 0.35 +
    scores.core_subjects * 0.20 +
    scores.soft_skills * 0.20;

  return Math.round(raw * attendanceMultiplier * backlogPenalty * 100) / 100;
}

// ---------------------------------------------------------------------------
// Placement Probability
// ---------------------------------------------------------------------------
export function getPlacementProbability(prs: number): { label: string; range: string } {
  if (prs >= 80) return { label: 'High', range: '78–92%' };
  if (prs >= 65) return { label: 'Medium', range: '45–70%' };
  if (prs >= 50) return { label: 'Low', range: '20–40%' };
  return { label: 'Critical', range: '<15%' };
}

// ---------------------------------------------------------------------------
// Company Tier Prediction
// ---------------------------------------------------------------------------
export function getCompanyTiers(prs: number, coding: number): string[] {
  if (prs >= 80 && coding >= 75) return ['Product (FAANG-tier)', 'Service (Top)', 'Startups'];
  if (prs >= 65 && coding >= 60) return ['Service (Top)', 'Service (Mid)', 'Startups'];
  if (prs >= 50) return ['Service (Mid)', 'Startups'];
  return ['Internships recommended first'];
}

// ---------------------------------------------------------------------------
// Weak Area Detection
// ---------------------------------------------------------------------------
export function detectWeakAreas(scores: StudentScores): WeakArea[] {
  const areas: WeakArea[] = [];

  const checks: { skill: string; score: number; recommendation: string }[] = [
    {
      skill: 'Aptitude',
      score: scores.aptitude,
      recommendation: 'Practice Quantitative Aptitude: Time-Speed, Probability, Permutations',
    },
    {
      skill: 'Coding',
      score: scores.coding,
      recommendation: 'Focus on DSA: Arrays, Trees, Graphs, Dynamic Programming',
    },
    {
      skill: 'Core Subjects',
      score: scores.core_subjects,
      recommendation: 'Revise DBMS, OS, Computer Networks fundamentals',
    },
    {
      skill: 'Soft Skills',
      score: scores.soft_skills,
      recommendation: 'Work on communication: Group discussions, Mock GDs, Presentation skills',
    },
    {
      skill: 'Attendance',
      score: scores.attendance,
      recommendation: 'Warning: Low attendance directly reduces your PRS score by 15%',
    },
  ];

  for (const c of checks) {
    if (c.score < 50) {
      areas.push({ skill: c.skill, score: c.score, severity: 'critical', recommendation: c.recommendation });
    } else if (c.score < 65) {
      areas.push({ skill: c.skill, score: c.score, severity: 'needs_improvement', recommendation: c.recommendation });
    } else {
      areas.push({ skill: c.skill, score: c.score, severity: 'good', recommendation: '' });
    }
  }

  return areas;
}

// ---------------------------------------------------------------------------
// Actionable Recommendations
// ---------------------------------------------------------------------------
export function generateRecommendations(scores: StudentScores): Recommendation[] {
  const recs: Recommendation[] = [];

  if (scores.coding < 60) {
    recs.push({
      icon: '💻',
      title: 'Boost Coding Skills',
      description: 'Solve 3 DSA problems daily on LeetCode/GeeksforGeeks. Focus on Arrays & Trees.',
      impact: '↑ +12 PRS points',
    });
  }
  if (scores.aptitude < 60) {
    recs.push({
      icon: '🧮',
      title: 'Sharpen Aptitude',
      description: 'Practice 20 quantitative problems daily. Cover Time-Speed-Distance, Probability.',
      impact: '↑ +8 PRS points',
    });
  }
  if (scores.core_subjects < 60) {
    recs.push({
      icon: '📚',
      title: 'Revise Core Subjects',
      description: 'Complete DBMS normalization, OS process scheduling, CN protocols this week.',
      impact: '↑ +6 PRS points',
    });
  }
  if (scores.soft_skills < 60) {
    recs.push({
      icon: '🗣️',
      title: 'Improve Communication',
      description: 'Join 2 mock GD sessions per week. Practice STAR method for interviews.',
      impact: '↑ +5 PRS points',
    });
  }
  if (scores.attendance < 75) {
    recs.push({
      icon: '📅',
      title: 'Improve Attendance',
      description: 'Your attendance is below 75%. This applies a 15% penalty to your PRS.',
      impact: '↑ +15% multiplier',
    });
  }
  if (scores.backlogs > 0) {
    recs.push({
      icon: '⚠️',
      title: 'Clear Backlogs',
      description: `You have ${scores.backlogs} backlog(s). Each backlog reduces PRS significantly.`,
      impact: scores.backlogs === 1 ? '↑ +8% multiplier' : '↑ +20% multiplier',
    });
  }

  // If student is doing well, motivational recommendations
  if (recs.length === 0) {
    recs.push({
      icon: '🏆',
      title: 'You\'re On Track!',
      description: 'Maintain consistency. Consider competitive programming for FAANG prep.',
      impact: 'Stay in Top 10%',
    });
    recs.push({
      icon: '🚀',
      title: 'Target Product Companies',
      description: 'With your scores, aim for Google, Microsoft, Amazon. Start system design prep.',
      impact: 'Product Tier Ready',
    });
  }

  // Always suggest mock tests
  if (scores.mock_tests_completed < 5) {
    recs.push({
      icon: '📝',
      title: 'Take More Mock Tests',
      description: `Only ${scores.mock_tests_completed} mock tests completed. Aim for at least 10.`,
      impact: '↑ +3 PRS points',
    });
  }

  return recs.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Full Analysis
// ---------------------------------------------------------------------------
export function analyzeStudent(scores: StudentScores): PRSResult {
  const prs = calculatePRS(scores);
  const prob = getPlacementProbability(prs);
  const weakAreas = detectWeakAreas(scores);
  const recommendations = generateRecommendations(scores);
  const companyTiers = getCompanyTiers(prs, scores.coding);

  return {
    score: prs,
    probability: prob.label,
    probabilityRange: prob.range,
    weakAreas,
    recommendations,
    companyTiers,
  };
}

// ---------------------------------------------------------------------------
// SmartCoach AI — Rule-based chat responses
// ---------------------------------------------------------------------------
export function generateCoachResponse(query: string, scores: StudentScores): string {
  const prs = calculatePRS(scores);
  const prob = getPlacementProbability(prs);
  const weakAreas = detectWeakAreas(scores).filter(a => a.severity !== 'good');
  const tiers = getCompanyTiers(prs, scores.coding);
  const q = query.toLowerCase();

  // Why is my PRS low?
  if (q.includes('why') && (q.includes('prs') || q.includes('low') || q.includes('score'))) {
    let response = `📊 Your current PRS is **${prs.toFixed(1)}** (${prob.label} probability: ${prob.range}).\n\n`;
    if (weakAreas.length === 0) {
      response += `Actually, your PRS is quite strong! You're performing well across all areas. Keep up the consistency.\n`;
    } else {
      response += `Here's what's pulling your score down:\n\n`;
      for (const wa of weakAreas) {
        const emoji = wa.severity === 'critical' ? '🔴' : '🟡';
        response += `${emoji} **${wa.skill}**: ${wa.score}/100 — ${wa.recommendation}\n`;
      }
      if (scores.backlogs > 0) {
        response += `\n⚠️ You have **${scores.backlogs} backlog(s)** applying a ${scores.backlogs === 1 ? '8%' : '20%'} penalty.\n`;
      }
      if (scores.attendance < 75) {
        response += `\n📅 Attendance is **${scores.attendance}%** (below 75%), applying a 15% penalty.\n`;
      }
    }
    return response;
  }

  // Product companies / how to get into
  if (q.includes('product') || q.includes('faang') || q.includes('google') || q.includes('company')) {
    const currentTier = tiers[0];
    let response = `🏢 Currently eligible for: **${tiers.join(', ')}**\n\n`;
    if (currentTier.includes('Product')) {
      response += `You're already in the Product tier range! 🎉\n\nTo maximize your chances:\n`;
      response += `1. Practice system design (2 problems/week)\n`;
      response += `2. Solve LeetCode mediums daily\n`;
      response += `3. Build 2-3 impressive projects\n`;
      response += `4. Prepare behavioral answers using STAR method\n`;
    } else {
      const codingGap = Math.max(0, 75 - scores.coding);
      const prsGap = Math.max(0, 80 - prs);
      response += `To reach **Product (FAANG-tier)**, you need:\n`;
      response += `- PRS ≥ 80 (you need +${prsGap.toFixed(0)} points)\n`;
      response += `- Coding ≥ 75 (you need +${codingGap} points)\n\n`;
      response += `**Action Plan:**\n`;
      response += `1. Solve 5 DSA problems daily for 30 days\n`;
      response += `2. Complete a full-stack project\n`;
      response += `3. Practice aptitude for 1 hour daily\n`;
      response += `4. Join mock interview sessions weekly\n`;
    }
    return response;
  }

  // Improvement plan
  if (q.includes('plan') || q.includes('improve') || q.includes('7-day') || q.includes('week')) {
    const weakest = weakAreas.sort((a, b) => a.score - b.score);
    let response = `📋 **Your Personalized 7-Day Improvement Plan:**\n\n`;

    const focus1 = weakest[0]?.skill || 'Coding';
    const focus2 = weakest[1]?.skill || 'Aptitude';

    response += `**Day 1 — ${focus1} Foundation**\n`;
    response += `• ${focus1 === 'Coding' ? 'Arrays & Strings: Solve 5 easy problems' : focus1 === 'Aptitude' ? 'Number Systems & Percentages: 20 problems' : focus1 === 'Core Subjects' ? 'DBMS: ER Diagrams, Normalization review' : 'Watch 2 TED talks, practice speaking for 15 min'}\n\n`;

    response += `**Day 2 — ${focus2} Basics**\n`;
    response += `• ${focus2 === 'Coding' ? 'Linked Lists & Stacks: Solve 5 problems' : focus2 === 'Aptitude' ? 'Time, Speed, Distance: 20 problems' : focus2 === 'Core Subjects' ? 'OS: Process scheduling, deadlocks' : 'Mock GD session with peers'}\n\n`;

    response += `**Day 3 — ${focus1} Deep Dive**\n`;
    response += `• ${focus1 === 'Coding' ? 'Trees & BST: Solve 5 medium problems' : 'Practice 25 problems in weak areas'}\n\n`;

    response += `**Day 4 — Mock Test**\n`;
    response += `• Take a full mock placement test\n• Review all wrong answers\n\n`;

    response += `**Day 5 — ${focus2} Practice**\n`;
    response += `• ${focus2 === 'Coding' ? 'Graphs: BFS/DFS, solve 5 problems' : 'Solve 30 mixed problems'}\n\n`;

    response += `**Day 6 — Integration**\n`;
    response += `• Mixed practice: 3 coding + 15 aptitude + 1 core subject chapter\n\n`;

    response += `**Day 7 — Assessment**\n`;
    response += `• Full mock test + review\n• Target: Score improvement visible\n\n`;

    response += `📈 **Estimated PRS increase: +8-15 points in 2 weeks**\n`;
    response += `🎯 Current: ${prs.toFixed(1)} → Target: ${Math.min(100, prs + 12).toFixed(1)}`;

    return response;
  }

  // What to study today
  if (q.includes('today') || q.includes('study') || q.includes('what should')) {
    const weakest = weakAreas.sort((a, b) => a.score - b.score)[0];
    let response = `📖 **Today's Study Plan** (${new Date().toLocaleDateString('en-IN', { weekday: 'long' })}):\n\n`;

    if (weakest) {
      response += `🎯 **Focus: ${weakest.skill}** (your weakest at ${weakest.score}/100)\n\n`;
      if (weakest.skill === 'Coding') {
        response += `1. ⏰ 9:00 AM — Solve 2 Easy array problems (30 min)\n`;
        response += `2. ⏰ 10:00 AM — Watch a Trees tutorial (45 min)\n`;
        response += `3. ⏰ 2:00 PM — Solve 3 Medium problems (1 hour)\n`;
        response += `4. ⏰ 4:00 PM — Review solutions & note patterns (30 min)\n`;
        response += `5. ⏰ 7:00 PM — Solve 1 contest problem (30 min)\n`;
      } else if (weakest.skill === 'Aptitude') {
        response += `1. ⏰ 9:00 AM — Quantitative: 15 problems (45 min)\n`;
        response += `2. ⏰ 10:30 AM — Logical Reasoning: 10 problems (30 min)\n`;
        response += `3. ⏰ 2:00 PM — Verbal Ability: Reading comprehension (30 min)\n`;
        response += `4. ⏰ 4:00 PM — Mixed practice test: 25 questions (45 min)\n`;
        response += `5. ⏰ 7:00 PM — Review mistakes & shortcuts (30 min)\n`;
      } else {
        response += `1. ⏰ 9:00 AM — Read 1 chapter of ${weakest.skill} (1 hour)\n`;
        response += `2. ⏰ 11:00 AM — Practice questions (30 min)\n`;
        response += `3. ⏰ 2:00 PM — Watch video lectures (45 min)\n`;
        response += `4. ⏰ 4:00 PM — Solve previous year questions (1 hour)\n`;
        response += `5. ⏰ 7:00 PM — Quick revision & flashcards (30 min)\n`;
      }
    } else {
      response += `You're strong across all areas! 💪\n\n`;
      response += `1. ⏰ 9:00 AM — Solve 3 Medium LeetCode problems\n`;
      response += `2. ⏰ 11:00 AM — System Design: read 1 case study\n`;
      response += `3. ⏰ 2:00 PM — Mock interview practice\n`;
      response += `4. ⏰ 4:00 PM — Build/contribute to a project\n`;
      response += `5. ⏰ 7:00 PM — Behavioral interview prep\n`;
    }

    response += `\n💡 **Pro tip:** You're ${prs >= 80 ? 'in the top tier' : `${(80 - prs).toFixed(0)} points away from Product Tier`}!`;
    return response;
  }

  // Default / generic question
  let response = `Hey! I'm **SmartCoach AI** 🤖\n\n`;
  response += `Here's a quick snapshot of your profile:\n\n`;
  response += `📊 **PRS Score:** ${prs.toFixed(1)}/100\n`;
  response += `🎯 **Placement Probability:** ${prob.label} (${prob.range})\n`;
  response += `🏢 **Eligible For:** ${tiers.join(', ')}\n\n`;

  if (weakAreas.length > 0) {
    response += `⚡ **Areas to focus on:**\n`;
    for (const wa of weakAreas) {
      response += `• ${wa.skill}: ${wa.score}/100 ${wa.severity === 'critical' ? '🔴' : '🟡'}\n`;
    }
    response += `\n`;
  }

  response += `Try asking me:\n`;
  response += `• "Why is my PRS low?"\n`;
  response += `• "How do I get into product companies?"\n`;
  response += `• "Give me a 7-day improvement plan"\n`;
  response += `• "What should I study today?"`;

  return response;
}

// Batch analytics helpers
export function calculateBatchStats(allScores: { scores: StudentScores; department?: string }[]) {
  const total = allScores.length;
  const prsScores = allScores.map(s => calculatePRS(s.scores));
  const avgPRS = prsScores.reduce((a, b) => a + b, 0) / total;
  const atRisk = prsScores.filter(p => p < 50).length;
  const highPerformers = prsScores.filter(p => p >= 80).length;

  // Department-wise
  const departments = new Map<string, number[]>();
  for (const s of allScores) {
    const dept = s.department || 'Unknown';
    if (!departments.has(dept)) departments.set(dept, []);
    departments.get(dept)!.push(calculatePRS(s.scores));
  }

  const deptStats = Array.from(departments.entries()).map(([dept, scores]) => ({
    department: dept,
    avgPRS: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length,
  }));

  return { total, avgPRS: Math.round(avgPRS), atRisk, highPerformers, deptStats };
}
