import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = checkoutSchema.parse(body);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    /*
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Chain Salad — The Ebook",
              description:
                "A comprehensive guide to modern development practices.",
              images: [`${appUrl}/book-cover.png`],
            },
            unit_amount: 49900, // ₹499.00 in paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        email,
        product: "chain-salad-ebook",
      },
    });

    return NextResponse.json({ url: session.url });
    */
    return NextResponse.json({ error: "Stripe checkout is temporarily disabled" }, { status: 503 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
