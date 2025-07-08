import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { hashPassword, generatePassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/utils/email";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import { canUserCreatePortal, canUserUploadFiles } from "@/lib/utils/subscription";

const portalSchema = z.object({
  name: z.string().min(2),
  clientEmail: z.string().email(),
  clientName: z.string(),
  description: z.string().optional(),
  status: z.enum(["active", "pending", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  welcomeNote: z.string().optional(),
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
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can create portals" }, { status: 403 });
    }

    // Check if user can create a new portal (plan limits)
    const canCreate = await canUserCreatePortal(user.id);
    if (!canCreate.allowed) {
      return NextResponse.json({ 
        error: canCreate.reason,
        upgradeRequired: canCreate.upgradeRequired 
      }, { status: 403 });
    }

    // Ensure uploads dir exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Parse form data using App Router's native formData()
    const formData = await req.formData();
    
    // Extract fields from formData
    const fields: any = {};
    const files: any = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value;
      } else {
        // Handle multiple values for the same key (like tags)
        if (fields[key]) {
          if (Array.isArray(fields[key])) {
            fields[key].push(value);
          } else {
            fields[key] = [fields[key], value];
          }
        } else {
          fields[key] = value;
        }
      }
    }

    // Convert tags to array if it's a string
    if (fields.tags && typeof fields.tags === 'string') {
      fields.tags = [fields.tags];
    }

    const parsed = portalSchema.safeParse({
      ...fields,
      tags: fields.tags || [],
    });
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    
    const {
      name,
      clientEmail,
      clientName,
      description,
      status = "active",
      tags = [],
      dueDate,
      welcomeNote,
    } = parsed.data;

    // Handle thumbnail upload
    let thumbnail_url = "";
    if (files.thumbnail) {
      const file = files.thumbnail as File;
      
      // Check file upload limits for thumbnail
      const uploadCheck = await canUserUploadFiles(user.id, file.size);
      if (!uploadCheck.allowed) {
        return NextResponse.json({ 
          error: uploadCheck.reason,
          upgradeRequired: uploadCheck.upgradeRequired 
        }, { status: 403 });
      }
      
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}_${file.name}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write file to disk
      fs.writeFileSync(filepath, Buffer.from(buffer));
      thumbnail_url = `/uploads/${filename}`;
    }

    // Use authenticated user ID
    const createdBy = user.id;

    // --- TRANSACTIONAL WORKFLOW ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create client user (or find existing)
      let client = await tx.user.findUnique({ where: { email: clientEmail } });
      let plainPassword = "";
      let isNewClient = false;
      
      if (!client) {
        isNewClient = true;
        plainPassword = generatePassword(12);
        const password_hash = await hashPassword(plainPassword);
        client = await tx.user.create({
          data: {
            name: clientName,
            email: clientEmail,
            password_hash,
            role: "client",
          },
        });
      }

      // 2. Create portal
      const portal = await tx.portal.create({
        data: {
          name,
          description: description || "",
          status,
          thumbnail_url,
          created_by: createdBy,
          client_id: client.id,
        },
      });

      // 3. Create SharedLink (magic link)
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const sharedLink = await tx.sharedLink.create({
        data: {
          portal_id: portal.id,
          token,
          is_revoked: false,
          expires_at: expiresAt,
          last_viewed_at: new Date(),
        },
      });

      // 4. Send welcome email based on client status
      const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login?token=${token}`;
      
      let emailHtml = "";
      let emailSubject = "";
      
      if (isNewClient) {
        // Email template for new clients with credentials
        emailSubject = `Welcome to Clientlane: ${name}`;
        emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -1px;">Clientlane</h1>
              <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">Your Client Portal Awaits</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Welcome to Clientlane!
              </h2>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${clientName}</strong>,
              </p>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your portal <strong>${name}</strong> has been created and is ready for you to explore! This secure workspace has been set up specifically for you to access project files, updates, and communicate seamlessly.
              </p>
              
              ${welcomeNote ? `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Personal Message:</h3>
                  <p style="color: #555555; margin: 0; font-size: 14px; line-height: 1.6;">${welcomeNote}</p>
                </div>
              ` : ''}
              
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
                  <li>Direct communication tools</li>
                  <li>Secure, organized workspace</li>
                </ul>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Your Login Credentials:</h3>
                <p style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">
                  <strong>Email:</strong> ${clientEmail}<br/>
                  <strong>Password:</strong> ${plainPassword}
                </p>
                <p style="color: #856404; margin: 0; font-size: 12px;">
                  We recommend changing your password after your first login for security.
                </p>
              </div>
              
              <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                This access link is secure and unique to you. It will expire in 24 hours. If you have any questions, please don't hesitate to reach out.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2024 Clientlane. This email was sent because a portal was created for you.
              </p>
            </div>
          </div>
        `;
      } else {
        // Email template for existing clients - just portal invitation
        emailSubject = `New Portal Invitation: ${name}`;
        emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -1px;">Clientlane</h1>
              <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 16px;">New Portal Invitation</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                You've been invited to a new portal!
              </h2>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>${clientName}</strong>,
              </p>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You have been invited to access a new portal: <strong>${name}</strong>. This secure workspace has been set up for you to access project files, updates, and communicate seamlessly.
              </p>
              
              ${welcomeNote ? `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Personal Message:</h3>
                  <p style="color: #555555; margin: 0; font-size: 14px; line-height: 1.6;">${welcomeNote}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                  Access Portal
                </a>
              </div>
              
              <div style="background-color: #e8f4fd; border: 1px solid #b8daff; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Access Information:</h3>
                <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.6;">
                  You can access this portal using your existing Clientlane account credentials. Simply click the link above to get started.
                </p>
              </div>
              
              <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                This access link is secure and unique to you. It will expire in 24 hours. If you have any questions, please don't hesitate to reach out.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2024 Clientlane. This email was sent because you were invited to a new portal.
              </p>
            </div>
          </div>
        `;
      }
      
      await sendEmail({
        to: clientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      // Log portal creation activity
      await tx.activity.create({
        data: {
          portal_id: portal.id,
          user_id: createdBy,
          type: "portal_created",
          meta: {
            portal_name: name,
            client_email: clientEmail,
            client_name: clientName,
            is_new_client: isNewClient,
          },
        },
      });

      // Log shared link creation activity
      await tx.activity.create({
        data: {
          portal_id: portal.id,
          user_id: createdBy,
          type: "shared_link_created",
          meta: {
            shared_link_token: token,
            expires_at: expiresAt.toISOString(),
          },
        },
      });

      return { portal, client, sharedLink };
    });

    return NextResponse.json({ portal: result.portal }, { status: 201 });
  } catch (err) {
    console.error("Portal creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 