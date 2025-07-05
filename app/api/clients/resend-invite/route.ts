import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { sendEmail } from "@/lib/utils/email";

const resendInviteSchema = z.object({
  clientId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists and is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can resend invitations" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = resendInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { clientId } = parsed.data;

    // Find the client and verify they belong to this freelancer
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        role: "client",
        client_portals: {
          some: {
            created_by: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
      },
    });

    if (!client) {
      return NextResponse.json({ 
        error: "Client not found or you don't have permission to access this client" 
      }, { status: 404 });
    }

    // Invalidate previous password if client already has one
    // This allows for resending invites to all clients, not just new ones
    if (client.password_hash) {
      await prisma.user.update({
        where: { id: clientId },
        data: { 
          password_hash: null as any
        },
      });
    }

    // Generate invitation link with unique token
    const inviteToken = Buffer.from(`${client.email}-${Date.now()}`).toString('base64');
    const inviteLink = `${process.env.NEXTAUTH_URL}/signup?invited_by=${user.id}&token=${inviteToken}&email=${encodeURIComponent(client.email)}`;
    
    // Determine if this is a new invite or resend based on previous password
    const isResend = client.password_hash !== null;
    
    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -1px;">Clientlane</h1>
          <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">Your Client Portal Awaits</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            ${isResend ? 'Your Invitation Has Been Updated' : 'You\'re Invited to Join Clientlane'}
          </h2>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${client.name}</strong>,
          </p>
          
          ${isResend ? `
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${user.name}</strong> has sent you a fresh invitation to access your client portal on Clientlane. Your previous access has been reset for security purposes.
            </p>
          ` : `
            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${user.name}</strong> has invited you to join their client portal on Clientlane, where you can view project updates, files, and communicate seamlessly.
            </p>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
              ${isResend ? 'Access Your Portal' : 'Accept Invitation'}
            </a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">What you'll get access to:</h3>
            <ul style="color: #555555; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Project files and documents</li>
              <li>Real-time updates and notifications</li>
              <li>Direct communication with ${user.name}</li>
              <li>Secure, organized project workspace</li>
            </ul>
          </div>
          
          <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
            This invitation link is secure and unique to you. If you have any questions, please don't hesitate to reach out to <strong>${user.name}</strong> directly.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © 2024 Clientlane. This email was sent because you were invited to join a client portal.
          </p>
        </div>
      </div>
    `;

    // Send email with appropriate subject
    const subject = isResend 
      ? `Updated invitation: Access your ${user.name} client portal`
      : `Invitation to join ${user.name}'s client portal`;

    await sendEmail({
      to: client.email,
      subject: subject,
      html: emailTemplate,
    });

    return NextResponse.json({ 
      message: isResend 
        ? "Fresh invitation sent successfully with updated access" 
        : "Invitation sent successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 