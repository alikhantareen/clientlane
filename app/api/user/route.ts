import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { canUserUploadFiles } from "@/lib/utils/subscription";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  removeImage: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, name: true, email: true, image: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let fields: any = {};
    let files: any = {};

    if (contentType.includes("multipart/form-data")) {
      // Handle form data (file upload)
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const formData = await req.formData();
      
      // Extract fields from formData
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files[key] = value;
        } else {
          fields[key] = value;
        }
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON data (remove image request)
      fields = await req.json();
    }

    // Validate the fields
    const parsed = updateProfileSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Handle image upload
    let image_url = undefined;
    if (files.image) {
      const file = files.image as File;
      
      // Check file upload limits for profile image
      const uploadCheck = await canUserUploadFiles(token.sub!, file.size);
      if (!uploadCheck.allowed) {
        return NextResponse.json({ 
          error: uploadCheck.reason,
          upgradeRequired: uploadCheck.upgradeRequired 
        }, { status: 403 });
      }
      
      const buffer = await file.arrayBuffer();
      const filename = `profile_${Date.now()}_${file.name}`;
      const filepath = path.join(process.cwd(), "public/uploads", filename);
      
      // Write file to disk
      fs.writeFileSync(filepath, Buffer.from(buffer));
      image_url = `/uploads/${filename}`;
    }

    // Update user profile
    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (image_url) updateData.image = image_url;
    if (parsed.data.removeImage) updateData.image = null;

    const updatedUser = await prisma.user.update({
      where: { id: token.sub },
      data: updateData,
      select: { id: true, name: true, email: true, image: true }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error("Error updating user profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 