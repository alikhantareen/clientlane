import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    console.log("🔍 Verify OTP Request - Email:", email, "OTP:", otp);
    
    if (!email || typeof email !== "string" || !otp || typeof otp !== "string") {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }
    
    // Find OTP record
    const otpRecord = await prisma.oTP.findUnique({ where: { email } });
    console.log("🔍 OTP Record found:", otpRecord ? "YES" : "NO");
    console.log("📊 OTP Record details:", otpRecord);
    
    if (!otpRecord) {
      console.log("❌ No OTP record found for email:", email);
      return NextResponse.json({ error: "The provided OTP is incorrect. Please try again." }, { status: 401 });
    }
    
    console.log("🔐 Comparing OTPs - Stored:", otpRecord.code, "Provided:", otp);
    if (otpRecord.code !== otp) {
      console.log("❌ OTP mismatch - Stored:", otpRecord.code, "Provided:", otp);
      return NextResponse.json({ error: "The provided OTP is incorrect. Please try again." }, { status: 401 });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      console.log("❌ OTP expired - Expires:", otpRecord.expiresAt, "Now:", new Date());
      // Expired
      await prisma.oTP.delete({ where: { email } });
      return NextResponse.json({ error: "The provided OTP has expired. Please request a new one." }, { status: 401 });
    }
    
    console.log("✅ OTP is valid, proceeding with verification");
    
    // OTP is valid, delete it and mark user as verified
    await prisma.oTP.delete({ where: { email } });
    
    // Mark the user's email as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() } as any,
    });
    
    console.log("🎉 User verified successfully:", email);
    
    // For forgot password flow, generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    
    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiresAt,
      },
    });
    
    return NextResponse.json({ 
      message: "OTP verified successfully",
      resetToken, // Only return token for forgot-password flow
      email 
    });
  } catch (error) {
    console.error("❌ Error in verify-otp:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
} 