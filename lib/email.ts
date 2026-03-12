export async function sendPurchaseConfirmationEmail({
  toEmail,
  downloadUrl,
}: {
  toEmail: string;
  downloadUrl: string;
}): Promise<void> {
  const apiKey = process.env.ZEPTOMAIL_API_KEY;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || "Chain Salad";

  if (!apiKey || !fromEmail) {
    console.warn("ZeptoMail not configured — skipping confirmation email");
    return;
  }

  const payload = {
    from: {
      address: fromEmail,
      name: fromName,
    },
    to: [
      {
        email_address: {
          address: toEmail,
        },
      },
    ],
    subject: "Your Ebook Purchase Confirmation 📚",
    htmlbody: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1a1a2e; font-size: 24px;">Thank you for your purchase!</h1>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Your payment has been confirmed. You can download your ebook using the link below.
          This link will expire in 5 minutes — you can always generate a new one from the success page.
        </p>
        <a href="${downloadUrl}" 
           style="display: inline-block; background: #6c63ff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">
          Download Your Ebook
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 24px;">
          If you have any questions, reply to this email and we'll be happy to help.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 32px;" />
        <p style="color: #aaa; font-size: 12px;">
          © ${new Date().getFullYear()} ${fromName}. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    const response = await fetch("https://api.zeptomail.in/v1.1/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ZeptoMail API error:", errorText);
      throw new Error(`ZeptoMail returned ${response.status}`);
    }

    console.log(`✅ Confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    // Don't throw — email failure shouldn't break the purchase flow
  }
}
