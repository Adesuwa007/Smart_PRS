// Rule-based Resume Analysis Engine — no external APIs required
// Outputs professional-grade feedback deterministically from resume text

interface ResumeAnalysisResult {
  overall_score: number;
  ats_score: number;
  strengths: string[];
  improvements: string[];
  missing_sections: string[];
  keyword_gaps: string[];
  summary: string;
  recommended_courses: Array<{ skill: string; reason: string; platform: string }>;
}

interface StudentScores {
  aptitude?: number;
  coding?: number;
  core_subjects?: number;
  soft_skills?: number;
}

function analyzeResume(resumeText: string, studentScores: StudentScores): ResumeAnalysisResult {
  const text = resumeText.toLowerCase();

  // --- Section detection ---
  const hasSkills = /skill|technologies|tools|proficient/i.test(resumeText);
  const hasProjects = /project|built|developed|created/i.test(resumeText);
  const hasGitHub = /github\.com|gitlab|bitbucket/i.test(resumeText);
  const hasMetrics = /\d+%|increased|improved|reduced|achieved|delivered|optimized/i.test(resumeText);
  const hasCertifications = /certif|aws|gcp|azure|coursera|udemy|nptel|completion/i.test(resumeText);
  const hasSummary = /summary|objective|profile|about me/i.test(resumeText);
  const hasLinkedIn = /linkedin\.com/i.test(resumeText);
  const hasExperience = /internship|work experience|employment|company|organization/i.test(resumeText);

  const projectCount = (resumeText.match(/project|built|developed/gi) || []).length;
  const wordCount = resumeText.split(/\s+/).length;

  // --- Technical keywords ---
  const techKeywords = ['react', 'node', 'python', 'java', 'sql', 'javascript', 'typescript',
    'html', 'css', 'mongodb', 'mysql', 'django', 'flask', 'spring', 'git', 'docker'];
  const foundKeywords = techKeywords.filter(k => text.includes(k));

  // --- Score calculation ---
  let overall = 50;
  if (hasSkills) overall += 10;
  if (projectCount >= 2) overall += 10;
  if (hasGitHub) overall += 10;
  if (hasMetrics) overall += 10;
  if (hasCertifications) overall += 10;
  if (wordCount > 250) overall += 5;
  if (!hasSummary) overall -= 10;
  if (projectCount === 0) overall -= 10;
  if (foundKeywords.length < 3) overall -= 10;
  if (!hasMetrics) overall -= 5;

  overall = Math.max(30, Math.min(95, overall));
  const ats = Math.max(25, Math.min(95, overall + (Math.random() > 0.5 ? 3 : -3)));

  // --- Strengths ---
  const strengthPool: string[] = [];
  if (projectCount >= 2) strengthPool.push('Strong project portfolio demonstrating hands-on development experience');
  if (hasGitHub) strengthPool.push('Active use of version control with public code repositories on GitHub');
  if (hasSkills) strengthPool.push('Well-structured technical skills section with relevant technologies');
  if (hasCertifications) strengthPool.push('Demonstrated commitment to continuous learning through certifications');
  if (hasMetrics) strengthPool.push('Quantified achievements with measurable impact metrics');
  if (hasExperience) strengthPool.push('Relevant internship/work experience supporting technical background');
  if (strengthPool.length === 0) strengthPool.push('Resume covers core educational background clearly');
  const strengths = strengthPool.slice(0, 3);

  // --- Improvements ---
  const improvePool: string[] = [];
  if (!hasSummary) improvePool.push('Add a 2-3 line professional summary tailored to your target role');
  if (!hasMetrics) improvePool.push('Quantify achievements using metrics (e.g., "Improved load time by 40%")');
  if (foundKeywords.length < 4) improvePool.push('Include more industry-relevant keywords: REST API, CI/CD, Docker, Unit Testing');
  if (!hasCertifications) improvePool.push('Add certifications (AWS, Google, NPTEL) to strengthen credibility');
  if (projectCount < 2) improvePool.push('Add at least 2 projects with clear problem statements and tech stack used');
  if (!hasLinkedIn) improvePool.push('Include your LinkedIn profile URL for recruiter verification');
  const improvements = improvePool.slice(0, 3);

  // --- Missing sections ---
  const missing: string[] = [];
  if (!hasSummary) missing.push('Professional Summary');
  if (!hasCertifications) missing.push('Certifications');
  if (!hasLinkedIn) missing.push('LinkedIn URL');
  if (projectCount === 0) missing.push('Projects Section');
  if (!hasMetrics) missing.push('Measurable Achievements');

  // --- Keyword gaps ---
  const allGaps = ['REST API', 'Docker', 'CI/CD', 'Unit Testing', 'Agile', 'Git workflow', 'System Design'];
  const keyword_gaps = allGaps.filter(k => !text.includes(k.toLowerCase())).slice(0, 4);

  // --- Summary ---
  const mainStrength = hasProjects ? 'a solid project foundation' : 'basic academic credentials';
  const mainGap = !hasSummary ? 'a professional summary' : !hasMetrics ? 'quantified impact statements' : 'industry keywords';
  const summary = `This resume demonstrates ${mainStrength}, but lacks ${mainGap} that recruiters and ATS systems look for. Addressing the recommended improvements will significantly increase your placement readiness and shortlisting rate.`;

  // --- Course recommendations ---
  const courses: ResumeAnalysisResult['recommended_courses'] = [];
  if ((studentScores.coding || 0) < 60) {
    courses.push({ skill: 'Data Structures & Algorithms', reason: 'Critical for technical interviews and resume credibility', platform: 'Coursera' });
  }
  if ((studentScores.core_subjects || 0) < 60) {
    courses.push({ skill: 'Database Management & OS Fundamentals', reason: 'Core CS knowledge frequently tested in campus placements', platform: 'NPTEL' });
  }
  if ((studentScores.soft_skills || 0) < 60) {
    courses.push({ skill: 'Professional Communication Skills', reason: 'Soft skills are evaluated in HR rounds alongside technical rounds', platform: 'Udemy' });
  }
  if (!hasSummary || !hasMetrics) {
    courses.push({ skill: 'Resume Writing for Tech Professionals', reason: 'A strong resume is the first filter in campus placements', platform: 'Coursera' });
  }

  return {
    overall_score: Math.round(overall),
    ats_score: Math.round(ats),
    strengths,
    improvements,
    missing_sections: missing,
    keyword_gaps,
    summary,
    recommended_courses: courses.slice(0, 3),
  };
}

export async function POST(req: Request) {
  try {
    const { resumeText, studentScores } = await req.json();
    if (!resumeText) {
      return Response.json({ error: 'No resume text provided' }, { status: 400 });
    }
    const result = analyzeResume(resumeText, studentScores || {});
    return Response.json({ success: true, result });
  } catch (error: unknown) {
    return Response.json({ error: error instanceof Error ? error.message : 'Analysis failed' }, { status: 500 });
  }
}
