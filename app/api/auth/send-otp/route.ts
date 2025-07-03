import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/email";
import { prisma } from "@/lib/prisma";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    // Delete any previous OTP for this email
    await prisma.oTP.deleteMany({ where: { email } });
    // Store new OTP
    await prisma.oTP.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });
    await sendEmail({
      to: email,
      subject: "Your Clientlane Verification Code",
      html: `<p>Your verification code is:</p><h2 style='font-size:2rem;letter-spacing:0.2em;'>${otp}</h2><p>This code will expire in 10 minutes.</p>`
    });
    return NextResponse.json({ message: "OTP sent" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
} 