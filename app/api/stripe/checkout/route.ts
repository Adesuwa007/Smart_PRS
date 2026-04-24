import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: Request) {
  const { plan } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Demo mode if no real key configured
  if (!stripeKey || !stripeKey.startsWith('sk_') || stripeKey.includes('placeholder') || stripeKey.includes('your_stripe')) {
    return Response.json({
      demo: true,
      message: 'Add real STRIPE_SECRET_KEY to .env.local to activate payments. For now, your plan is simulated as upgraded.',
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' });

  // Price IDs — set real ones in .env.local from Stripe dashboard
  const priceMap: Record<string, string> = {
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceMap[plan] || priceMap.pro, quantity: 1 }],
      success_url: `${appUrl}/dashboard/admin/settings?upgraded=true`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
    });

    return Response.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe checkout failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
