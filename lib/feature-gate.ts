// ============================================================================
// SmartPRS — Feature Gate Logic
// ============================================================================

import { Plan, FeatureGateResult } from '@/types';

const FEATURE_REQUIREMENTS: Record<string, Plan[]> = {
  'ai-predictions': ['pro', 'enterprise'],
  'placement-probability': ['pro', 'enterprise'],
  'csv-export': ['pro', 'enterprise'],
  'batch-analytics': ['pro', 'enterprise'],
  'company-filtering': ['pro', 'enterprise'],
  'ai-resume-analyzer': ['pro', 'enterprise'],
  'smart-coach-advanced': ['pro', 'enterprise'],
  'unlimited-students': ['pro', 'enterprise'],
  'multi-campus': ['enterprise'],
  'custom-ml': ['enterprise'],
  'api-access': ['enterprise'],
  'lms-integration': ['enterprise'],
};

export function checkFeatureAccess(feature: string, plan: Plan): FeatureGateResult {
  const required = FEATURE_REQUIREMENTS[feature];
  if (!required) return { allowed: true, reason: '' };

  if (required.includes(plan)) {
    return { allowed: true, reason: '' };
  }

  const minPlan = required[0] === 'pro' ? 'Pro' : 'Enterprise';
  return {
    allowed: false,
    reason: `This feature requires the ${minPlan} plan. Upgrade to unlock ${feature.replace(/-/g, ' ')}.`,
  };
}

export function getPlanFeatures(plan: Plan): string[] {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([, plans]) => plans.includes(plan))
    .map(([feature]) => feature);
}
