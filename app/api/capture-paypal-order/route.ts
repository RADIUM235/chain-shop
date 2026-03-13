import { NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";
import { getPrismaClient } from "@/lib/db";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getBookById } from "@/lib/books";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token"); // PayPal Order ID

    if (!token) {
      return NextResponse.redirect(new URL("/cancel", request.url));
    }

    const { accessToken, baseUrl } = await getPayPalAccessToken();

    // Capture the payment using the token
    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("PayPal Capture failed:", captureData);
      return NextResponse.redirect(new URL("/cancel", request.url));
    }

    // Capture successful
    const purchaseUnit = captureData.purchase_units?.[0];
    
    // Parse the custom_id which we stringified in the create-order step
    let email = captureData.payer?.email_address || "unknown-email";
    let bookId = "item-1"; // Fallback
    
    if (purchaseUnit?.custom_id) {
      try {
        const parsed = JSON.parse(purchaseUnit.custom_id);
        if (parsed.email) email = parsed.email;
        if (parsed.bookId) bookId = parsed.bookId;
      } catch (e) {
        // If it's not JSON (maybe an older purchase checkout), use it as email
        email = purchaseUnit.custom_id;
      }
    }

    try {
      const prisma = getPrismaClient();

      // Save purchase to database
      await prisma.userPurchase.upsert({
        where: { paypalOrderId: token },
        update: { paymentStatus: "completed" },
        create: {
          email,
          bookId,
          paypalOrderId: token,
          paymentStatus: "completed",
        },
      });

      console.log(`✅ Purchase recorded via PayPal for ${email} (book: ${bookId}, order: ${token})`);

      // Send confirmation email
      try {
        const book = getBookById(bookId);
        // Only generate link if the book has an s3Key
        if (book && book.s3Key) {
            const downloadUrl = await getPresignedDownloadUrl(book.s3Key);
            await sendPurchaseConfirmationEmail({
              toEmail: email,
              downloadUrl,
            });
        }
      } catch (emailError) {
        console.error("Failed to send PayPal confirmation email:", emailError);
        // Don't fail the complete process for email errors
      }
    } catch (dbError) {
      console.error("Database error during PayPal capture:", dbError);
      // We still redirect to success if payment went through, but log error
    }

    // Redirect to the success page with the order ID
    return NextResponse.redirect(
      new URL(`/success?session_id=${token}`, request.url)
    );
  } catch (error) {
    console.error("Unexpected error during PayPal capture:", error);
    return NextResponse.redirect(new URL("/cancel", request.url));
  }
}
