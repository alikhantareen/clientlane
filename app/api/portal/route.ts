import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { hashPassword, generatePassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/utils/email";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";

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
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      // 1. Create client user (or find existing)
      let client = await tx.user.findUnique({ where: { email: clientEmail } });
      let plainPassword = "";
      if (!client) {
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

      // 4. Send welcome email
      const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/magic-login/${token}`;
      const emailHtml = `
        <h2>Hi ${clientName},</h2>
        <p>Welcome to Clientlane!</p>
        <p>Your portal <b>${name}</b> has been created.</p>
        <p><b>Welcome Note:</b> ${welcomeNote || ""}</p>
        <p>Access your portal with this one-click link (valid for 24 hours):<br/>
        <a href="${magicLink}">${magicLink}</a></p>
        <p>Your initial password: <b>${plainPassword || "(existing user)"}</b></p>
        <p>We recommend you change your password after logging in.</p>
      `;
      await sendEmail({
        to: clientEmail,
        subject: `Welcome to Clientlane: ${name}`,
        html: emailHtml,
      });

      return { portal, client, sharedLink };
    });

    return NextResponse.json({ portal: result.portal }, { status: 201 });
  } catch (err) {
    console.error("Portal creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 