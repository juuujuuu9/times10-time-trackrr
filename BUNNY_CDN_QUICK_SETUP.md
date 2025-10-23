# Quick Bunny CDN Setup for Times10 Time Tracker

Since you already have Bunny CDN configured with `trackr-cloud-net.b-cdn.net`, we just need to set up the storage zone for file uploads.

## Step 1: Create a Storage Zone (if you don't have one)

1. **Log into your Bunny CDN dashboard**
2. **Go to "Storage"** in the sidebar
3. **Click "Add Storage Zone"**
4. **Configure**:
   - **Name**: `times10-files` (or use existing storage zone)
   - **Region**: Choose closest to your users
5. **Save the credentials**: Note the **Storage Zone Name** and **Password**

## Step 2: Configure Environment Variables

Create or update your `.env.local` file with:

```bash
# Bunny CDN Configuration
BUNNY_STORAGE_ZONE_NAME=your-storage-zone-name
BUNNY_STORAGE_ZONE_PASSWORD=your-storage-zone-password
BUNNY_STORAGE_ZONE_REGION=ny
BUNNY_CDN_URL=https://trackr-cloud-net.b-cdn.net
```

## Step 3: Test the Integration

Run the test script to verify everything works:

```bash
node test-bunny-cdn.js
```

## Step 4: Test File Upload in Your App

1. **Start your dev server**: `npm run dev`
2. **Go to a collaboration page**
3. **Try uploading a file** through the TaskStream component
4. **Check console logs** for upload success

## File Organization

Files will be stored in your Bunny CDN storage as:
```
collaborations/
├── {collaborationId}/
│   └── tasks/
│       └── {taskId}/
│           ├── {timestamp}_{randomId}_{filename}
│           └── {timestamp}_{randomId}_{filename}
```

And accessible via:
```
https://trackr-cloud-net.b-cdn.net/collaborations/{collaborationId}/tasks/{taskId}/{filename}
```

## Benefits of Using Your Existing CDN

✅ **Fast Global Access**: Files served from Bunny CDN's global network
✅ **Cost Effective**: Leverage your existing CDN setup
✅ **Reliable**: Bunny CDN's proven infrastructure
✅ **Organized**: Automatic folder structure for easy management
✅ **Secure**: Files organized by collaboration and task

## Troubleshooting

If you encounter issues:

1. **Check credentials** in `.env.local`
2. **Verify storage zone is active** in Bunny CDN dashboard
3. **Test with the script** first: `node test-bunny-cdn.js`
4. **Check browser console** for detailed error messages

## Next Steps

Once configured, your TaskStream component will:
- Upload files directly to Bunny CDN storage
- Serve files via your existing CDN for fast access
- Organize files automatically by collaboration and task
- Provide download links that work globally
