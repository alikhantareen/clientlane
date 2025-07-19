import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { canUserUploadFiles } from "@/lib/utils/subscription";
import { uploadToBlob, deleteFromBlob, isBlobUrl } from "@/lib/utils/blob";

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
      select: { id: true, name: true, email: true, image: true, password_hash: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data with hasPassword flag (don't expose actual password_hash)
    const { password_hash, ...userProfile } = user;
    const userResponse = {
      ...userProfile,
      hasPassword: password_hash !== null
    };

    return NextResponse.json({ user: userResponse });
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
      
      // Upload file to Vercel Blob Storage
      const blobResult = await uploadToBlob(file, 'profile-images');
      image_url = blobResult.url;
    }

    // Get current user to check for existing image
    const currentUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { image: true }
    });

    // Update user profile
    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (image_url) {
      updateData.image = image_url;
      // Delete old image if it exists and is a blob URL
      if (currentUser?.image && isBlobUrl(currentUser.image)) {
        try {
          await deleteFromBlob(currentUser.image);
        } catch (err) {
          console.error("Error deleting old profile image:", err);
        }
      }
    }
    if (parsed.data.removeImage) {
      updateData.image = null;
      // Delete old image if it exists and is a blob URL
      if (currentUser?.image && isBlobUrl(currentUser.image)) {
        try {
          await deleteFromBlob(currentUser.image);
        } catch (err) {
          console.error("Error deleting old profile image:", err);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: token.sub },
      data: updateData,
      select: { id: true, name: true, email: true, image: true, password_hash: true }
    });

    // Return user data with hasPassword flag (don't expose actual password_hash)
    const { password_hash, ...userProfile } = updatedUser;
    const userResponse = {
      ...userProfile,
      hasPassword: password_hash !== null
    };

    return NextResponse.json({ user: userResponse });
  } catch (err) {
    console.error("Error updating user profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 