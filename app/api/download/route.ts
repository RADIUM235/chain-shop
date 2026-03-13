import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getBookById } from "@/lib/books";

export async function GET(request: Request) {
  try {
    const prisma = getPrismaClient();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Verify payment in database
    const purchase = await prisma.userPurchase.findFirst({
      where: {
        OR: [{ stripeSessionId: sessionId }, { paypalOrderId: sessionId }],
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.paymentStatus !== "completed") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 403 }
      );
    }

    // Lookup book specific logic
    const book = getBookById(purchase.bookId);
    if (!book || !book.s3Key) {
      return NextResponse.json(
        { error: "Book file not configured" },
        { status: 500 }
      );
    }

    // Generate presigned download URL with the specific object key
    const downloadUrl = await getPresignedDownloadUrl(book.s3Key);

    // Increment download count
    await prisma.userPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
