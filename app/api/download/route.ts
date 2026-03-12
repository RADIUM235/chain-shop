import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/s3";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Verify payment in database
    const purchase = await prisma.userPurchase.findUnique({
      where: { stripeSessionId: sessionId },
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

    // Generate presigned download URL
    const downloadUrl = await getPresignedDownloadUrl();

    // Increment download count
    await prisma.userPurchase.update({
      where: { stripeSessionId: sessionId },
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
