// ============================================================================
// SmartPRS — Stripe Configuration
// ============================================================================

export const PLANS = {
  pro: {
    name: 'SmartPRS Pro',
    price: '₹8,499/month',
    priceUsd: '$99/month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    features: [
      'Unlimited students',
      'Full AI Readiness Engine',
      'Placement Probability predictions',
      'Advanced batch analytics',
      'CSV export',
      'Company-tier filtering',
      'AI Resume Analyzer',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'SmartPRS Enterprise',
    price: 'Custom',
    priceUsd: 'Custom',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
    features: [
      'Everything in Pro',
      'Multi-campus deployment',
      'Custom ML model training',
      'LMS/ERP integration',
      'Dedicated account manager',
      'SLA guarantee',
      'API access',
    ],
  },
} as const;

// Get Stripe instance lazily (avoids build errors when no key is set)
export function getStripe() {
  if (typeof window !== 'undefined') return null; // Client-side: use @stripe/stripe-js
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('stripe')(key);
}
