import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Purchase from "@/models/Purchase";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    const rawBody = await req.text(); // raw string
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // TODO: handle event types you care about
    // Example:
    // if (event.type === "checkout.session.completed") { ... }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
