import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize the Stripe client. 
// Note: Depending on your exact stripe version, it may warn about missing apiVersion. 
// You can add apiVersion: '2024-12-18.acacia' (or your current version) to the config object if needed.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the signature using the raw body and the secret
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Log the success message as requested
    console.log(`✅ Checkout Session completed! Session ID: ${session.id}`);
    
    // Initialize Supabase admin client to bypass RLS (fallback to anon if missing)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabaseAdmin.from('orders').insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email || session.customer_email || null,
      total_amount: session.amount_total ? session.amount_total / 100 : 0,
      status: 'PAID'
    });

    if (error) {
      console.error('❌ Error saving order to Supabase:', error);
      // We log the error but still return 200 to Stripe so it doesn't keep retrying unnecessarily,
      // unless you strictly want Stripe to retry the webhook delivery on DB failure.
    }
  } else {
    // Log unhandled events for debugging
    console.log(`🔔 Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 });
}
