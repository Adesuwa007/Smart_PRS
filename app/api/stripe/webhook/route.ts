import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') || '';

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret || !stripeKey.startsWith('sk_')) {
      return NextResponse.json({ received: true, mode: 'demo - configure Stripe keys' });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stripe = require('stripe')(stripeKey);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const plan = session.metadata?.plan;
        const collegeId = session.metadata?.collegeId;
        console.log(`✅ Checkout complete: plan=${plan}, college=${collegeId}`);
        // In production: update college plan in Supabase
        break;
      }
      case 'customer.subscription.deleted': {
        console.log('❌ Subscription cancelled');
        break;
      }
      case 'invoice.payment_failed': {
        console.log('⚠️ Payment failed');
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
