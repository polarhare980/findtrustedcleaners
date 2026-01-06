import Stripe from "stripe";
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
    console.error("❌ Stripe signature verification failed:", err?.message || err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await connectToDatabase();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const md = session.metadata || {};

      const purchaseId = md.purchaseId || null;
      const stripeCheckoutSessionId = session.id || null;
      const paymentIntentId = session.payment_intent || null;

      if (purchaseId) {
        await Purchase.findByIdAndUpdate(
          purchaseId,
          {
            stripeCheckoutSessionId,
            stripePaymentIntentId: paymentIntentId,
            paymentStatus: "pending", // or whatever your flow uses
          },
          { new: true }
        );
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Server error", { status: 500 });
  }
}
