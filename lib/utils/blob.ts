import { put, del } from '@vercel/blob';
import { NextRequest } from 'next/server';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/**
 * Upload a file to Vercel Blob Storage
 */
export async function uploadToBlob(
  file: File,
  folder: string = 'uploads'
): Promise<BlobUploadResult> {
  try {
    const filename = `${Date.now()}_${file.name}`;
    const blob = await put(`${folder}/${filename}`, file, {
      access: 'public',
    });

         return {
       url: blob.url,
       pathname: blob.pathname,
       contentType: blob.contentType,
       size: file.size,
     };
  } catch (error) {
    console.error('Error uploading to blob:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete a file from Vercel Blob Storage
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Error deleting from blob:', error);
    // Don't throw error as file might already be deleted
  }
}

/**
 * Extract filename from blob URL
 */
export function getFilenameFromBlobUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1];
  } catch (error) {
    console.error('Error extracting filename from blob URL:', error);
    return 'unknown';
  }
}

/**
 * Check if a URL is a blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com');
} 