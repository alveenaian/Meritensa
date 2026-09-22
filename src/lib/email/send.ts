interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  // For MVP, we just log the email to console
  // In production, this would integrate with Resend, SendGrid, etc.
  
  console.log("\n" + "=".repeat(80));
  console.log("[EMAIL NOTIFICATION]");
  console.log("=".repeat(80));
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log("-".repeat(80));
  console.log("HTML Body:");
  console.log(params.html);
  console.log("-".repeat(80));
  console.log("Text Body:");
  console.log(params.text);
  console.log("=".repeat(80) + "\n");

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));
}
