import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { sendEmail } from "@/lib/utils/email";
import { hashPassword, generatePassword } from "@/lib/auth/password";
import crypto from "crypto";

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
        client_portals: {
          where: {
            created_by: user.id,
          },
          select: {
            id: true,
            name: true,
          },
          take: 1, // Get one portal for the email context
        },
      },
    });

    if (!client) {
      return NextResponse.json({ 
        error: "Client not found or you don't have permission to access this client" 
      }, { status: 404 });
    }

    // Use transactional workflow for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate new password and hash it
      const plainPassword = generatePassword(12);
      const password_hash = await hashPassword(plainPassword);
      
      // 2. Update client with new password and mark email as verified
      await tx.user.update({
        where: { id: clientId },
        data: { 
          password_hash,
          email_verified: true, // Mark as verified since they have access to email
        },
      });

      // 3. Create SharedLink (magic link) for direct access
      const magicToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Find a portal to associate the shared link with (or use the first one)
      const portalId = client.client_portals[0]?.id;
      
      let sharedLink = null;
      if (portalId) {
        // Revoke any existing shared links for this portal
        await tx.sharedLink.updateMany({
          where: { portal_id: portalId },
          data: { is_revoked: true },
        });
        
        // Create new shared link
        sharedLink = await tx.sharedLink.create({
          data: {
            portal_id: portalId,
            token: magicToken,
            is_revoked: false,
            expires_at: expiresAt,
            last_viewed_at: new Date(),
          },
        });
      }

      return { plainPassword, magicToken, portalId, sharedLink };
    });

    // 4. Generate magic link for login
    const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login?token=${result.magicToken}`;
    
    // 5. Use the same email template as new client registration with credentials
    const portalName = client.client_portals[0]?.name || "your client portal";
    const emailSubject = `Updated Access: ${user.name}'s Client Portal`;
    
    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -1px;">Clientlane</h1>
          <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">Your Client Portal Awaits</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Your Access Has Been Updated!
          </h2>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${client.name}</strong>,
          </p>
          
          <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong>${user.name}</strong> has updated your access to <strong>${portalName}</strong> on Clientlane. Your new login credentials are ready, and you can access your secure workspace to view project files, updates, and communicate seamlessly.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
              Access Your Portal
            </a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">What you'll find in your portal:</h3>
            <ul style="color: #555555; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Project files and documents</li>
              <li>Real-time updates and notifications</li>
              <li>Direct communication with ${user.name}</li>
              <li>Secure, organized project workspace</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Your Updated Login Credentials:</h3>
            <p style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">
              <strong>Email:</strong> ${client.email}<br/>
              <strong>Password:</strong> ${result.plainPassword}
            </p>
            <p style="color: #856404; margin: 0; font-size: 12px;">
              We recommend changing your password after your first login for security. You can do this in your profile settings.
            </p>
          </div>
          
          <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
            This access link is secure and unique to you. It will expire in 24 hours. If you have any questions, please don't hesitate to reach out to <strong>${user.name}</strong> directly.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Clientlane. This email was sent because your portal access was updated.
          </p>
        </div>
      </div>
    `;

    // 6. Send email with new credentials
    await sendEmail({
      to: client.email,
      subject: emailSubject,
      html: emailTemplate,
    });

    return NextResponse.json({ 
      message: "Fresh invitation sent successfully with new credentials and access link"
    }, { status: 200 });

  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 