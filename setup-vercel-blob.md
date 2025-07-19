# Vercel Blob Storage Setup

## What we've done:
1. ✅ Installed `@vercel/blob` package
2. ✅ Created blob utility functions in `lib/utils/blob.ts`
3. ✅ Updated API routes to use blob storage instead of filesystem
4. ✅ Added file deletion from blob storage when files are removed

## What you need to do on Vercel:

### 1. Enable Blob Storage
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to **Storage** tab
4. Create a new **Blob** store
5. Copy the connection string

### 2. Set Environment Variables
Add these environment variables in your Vercel project settings:

```
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

### 3. Deploy
Once you set the environment variable, deploy your changes:

```bash
git add .
git commit -m "Migrate from filesystem to Vercel Blob Storage"
git push
```

## How it works now:

### Before (Filesystem):
- Files uploaded to `public/uploads/` folder
- File URLs like `/uploads/filename.jpg`
- ❌ Won't work on Vercel serverless functions

### After (Blob Storage):
- Files uploaded to Vercel Blob Storage
- File URLs like `https://blob.vercel-storage.com/...`
- ✅ Works perfectly on Vercel

## Benefits:
- **Serverless Compatible**: Works with Vercel's serverless functions
- **Automatic CDN**: Files served from global CDN
- **Reliable**: No risk of losing files during deployments
- **Scalable**: Handle large files and high traffic
- **Secure**: Private files with signed URLs when needed

## Files Updated:
✅ **Complete Migration - All files updated:**
- `app/api/updates/route.ts` - Main update creation
- `app/api/updates/[updateId]/route.ts` - Reply creation and editing  
- `app/api/portal/route.ts` - Portal thumbnail uploads
- `app/api/portals/[id]/route.ts` - Portal thumbnail updates and deletion
- `app/api/user/route.ts` - Profile image uploads with old image cleanup
- `app/api/replies/[replyId]/route.ts` - Reply file uploads and editing
- `app/api/files/[fileId]/route.ts` - File deletion from blob storage
- `app/api/files/route.ts` - Cleaned up unused imports
- `lib/utils/blob.ts` - New blob utility functions

## ✅ Migration Complete!
All file upload/deletion operations have been migrated from filesystem to Vercel Blob Storage. Your app is now fully compatible with Vercel's serverless environment. 