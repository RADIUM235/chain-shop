import { NextResponse } from "next/server";
import { z } from "zod";
import { getPayPalAccessToken } from "@/lib/paypal";

import { getBookById } from "@/lib/books";

const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  bookId: z.string().min(1, "Book ID is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, bookId } = checkoutSchema.parse(body);

    const book = getBookById(bookId);
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `purchase-${bookId}`,
            description: `${book.title} — ${book.subtitle}`,
            amount: {
              currency_code: "INR",
              value: book.price.toFixed(2),
            },
            custom_id: JSON.stringify({ email, bookId }), // Store email and bookId here for easy lookup during capture
          },
        ],
        application_context: {
          brand_name: "Chain Salad",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: `${appUrl}/api/capture-paypal-order`,
          cancel_url: `${appUrl}/cancel`,
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.message || "Failed to create PayPal order");
    }

    // Find the approval URL to redirect the user
    // The link format is: { href: '...', rel: 'approve', method: 'GET' }
    const approveLink = order.links?.find((link: any) => link.rel === "approve");

    if (!approveLink) {
      throw new Error("No approve link found in PayPal response");
    }

    return NextResponse.json({ url: approveLink.href });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("PayPal order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
