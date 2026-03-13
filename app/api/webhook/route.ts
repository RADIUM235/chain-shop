import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
// import { prisma } from "@/lib/db";
// import { sendPurchaseConfirmationEmail } from "@/lib/email";
// import { getPresignedDownloadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

/*
  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_email || session.metadata?.email || "";
    const stripeSessionId = session.id;

    try {
      // Save purchase to database
      await prisma.userPurchase.upsert({
        where: { stripeSessionId },
        update: { paymentStatus: "completed" },
        create: {
          email,
          stripeSessionId,
          paymentStatus: "completed",
        },
      });

      console.log(`✅ Purchase recorded for ${email} (session: ${stripeSessionId})`);

      // Send confirmation email
      try {
        const downloadUrl = await getPresignedDownloadUrl();
        await sendPurchaseConfirmationEmail({
          toEmail: email,
          downloadUrl,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the webhook for email errors
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to record purchase" },
        { status: 500 }
      );
    }
  }
*/
  return NextResponse.json({ received: true });
}
