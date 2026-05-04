import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Map cart items to Stripe's line_items format
    const line_items = items.map((item: any) => {
      // Create a valid image array only if the URL is absolute
      let images: string[] = [];
      if (item.image && item.image.startsWith('http')) {
        images = [item.image];
      } else if (item.image && process.env.NEXT_PUBLIC_SITE_URL) {
        images = [`${process.env.NEXT_PUBLIC_SITE_URL}${item.image}`];
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(images.length > 0 && { images }),
          },
          // Stripe expects the unit_amount in cents
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/cart`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
