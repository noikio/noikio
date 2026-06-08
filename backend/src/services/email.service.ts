import { Resend } from "resend";

const resend = process.env["RESEND_API_KEY"]
  ? new Resend(process.env["RESEND_API_KEY"])
  : null;
const FROM_EMAIL = process.env["FROM_EMAIL"] ?? "otp@noikio.com";

export async function sendOtp(email: string, code: string): Promise<void> {
  if (!resend) {
    console.log(`[OTP] ${email} → ${code}`);
    return;
  }

  try {
    await resend.emails.send({
      from: `noikio <${FROM_EMAIL}>`,
      to: email,
      subject: `Your login code: ${code}`,
      html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="color:#1e1b4b;margin-bottom:8px">Your login code</h2>
        <p style="color:#64748b;margin-bottom:24px">Enter this code to sign in to noikio. It expires in 10 minutes.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6366f1;padding:20px;background:#f1f5f9;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    });
  } catch (err) {
    console.error("[OTP] Resend error:", err);
    throw err;
  }
}
