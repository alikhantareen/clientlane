import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || typeof email !== "string" || !otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }
    // Find OTP record
    const otpRecord = await prisma.oTP.findUnique({ where: { email } });
    if (!otpRecord) {
      return NextResponse.json({ error: "The provided OTP is incorrect. Please try again." }, { status: 401 });
    }
    if (otpRecord.code !== otp) {
      return NextResponse.json({ error: "The provided OTP is incorrect. Please try again." }, { status: 401 });
    }
    if (otpRecord.expiresAt < new Date()) {
      // Expired
      await prisma.oTP.delete({ where: { email } });
      return NextResponse.json({ error: "The provided OTP has expired. Please request a new one." }, { status: 401 });
    }
    // OTP is valid, delete it
    await prisma.oTP.delete({ where: { email } });
    return NextResponse.json({ message: "OTP has been verified successfully." }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 