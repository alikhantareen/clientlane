import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/email";
import { prisma } from "@/lib/prisma";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    console.log("📧 Send OTP Request for email:", email);
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    console.log("🔐 Generated OTP:", otp, "for email:", email);
    
    // Delete any previous OTP for this email
    const deleteResult = await prisma.oTP.deleteMany({ where: { email } });
    console.log("🗑️ Deleted previous OTPs:", deleteResult.count);
    
    // Store new OTP
    const createdOTP = await prisma.oTP.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });
    console.log("💾 Created OTP record:", createdOTP.id, "for email:", email);
    
    // Verify the OTP was actually stored
    const verifyStored = await prisma.oTP.findUnique({ where: { email } });
    console.log("✅ Verified OTP in DB:", verifyStored ? "Found" : "NOT FOUND");
    
    await sendEmail({
      to: email,
      subject: "Your Clientlane Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -1px;">Clientlane</h1>
            <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">Your Client Portal Awaits</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
              Your Verification Code
            </h2>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi there,
            </p>
            
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Please use the verification code below to complete your account setup. This code will expire in 10 minutes for your security.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 30px; display: inline-block; min-width: 250px;">
                <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Your Verification Code:</h3>
                <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 0.3em; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">⏰ Important:</h3>
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                This verification code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
            </div>
            
            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
              If you're having trouble entering the code, make sure to copy and paste it exactly as shown above. If you continue to have issues, please contact support.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Clientlane. This email was sent because you requested a verification code.
            </p>
          </div>
        </div>
      `
    });
    console.log("📤 Email sent successfully to:", email);
    
    return NextResponse.json({ message: "OTP sent" });
  } catch (err) {
    console.error("❌ Error in send-otp:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
} 