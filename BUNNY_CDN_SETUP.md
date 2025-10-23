# Bunny CDN Integration Setup Guide

This guide will help you set up Bunny CDN for file storage in your Times10 Time Tracker application.

## Prerequisites

1. A Bunny CDN account (sign up at https://bunny.net)
2. A Storage Zone created in your Bunny CDN dashboard

## Step 1: Create a Storage Zone

1. Log in to your Bunny CDN dashboard
2. Go to "Storage" in the sidebar
3. Click "Add Storage Zone"
4. Choose a name for your storage zone (e.g., "times10-files")
5. Select the region closest to your users
6. Note down the Storage Zone name and password

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Bunny CDN Configuration
BUNNY_STORAGE_ZONE_NAME=your-storage-zone-name
BUNNY_STORAGE_ZONE_PASSWORD=your-storage-zone-password
BUNNY_STORAGE_ZONE_REGION=ny
BUNNY_CDN_URL=https://trackr-cloud-net.b-cdn.net
```

**Note**: Since you already have a Bunny CDN setup with `trackr-cloud-net.b-cdn.net`, you can use this existing CDN URL for file access.

### Environment Variables Explained:

- **BUNNY_STORAGE_ZONE_NAME**: The name of your storage zone (from step 1)
- **BUNNY_STORAGE_ZONE_PASSWORD**: The password for your storage zone (from step 1)
- **BUNNY_STORAGE_ZONE_REGION**: The region code for your storage zone
  - `ny` - New York
  - `la` - Los Angeles
  - `sg` - Singapore
  - `syd` - Sydney
  - `fra` - Frankfurt
  - `sao` - São Paulo
- **BUNNY_CDN_URL**: Your CDN URL for accessing files (format: `https://your-cdn-url.b-cdn.net`)

## Step 3: Get Your CDN URL

1. In your Bunny CDN dashboard, go to "CDN" → "Pull Zones"
2. Create a new Pull Zone or use an existing one
3. The CDN URL will be in the format: `https://your-pull-zone-name.b-cdn.net`
4. Use this URL as your `BUNNY_CDN_URL`

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to a collaboration page
3. Try uploading a file through the TaskStream component
4. Check the browser console for upload logs
5. Verify the file is accessible via the returned URL

## File Organization

Files are organized in Bunny CDN storage as follows:

```
collaborations/
├── {collaborationId}/
│   └── tasks/
│       └── {taskId}/
│           ├── {timestamp}_{randomId}_{filename}
│           └── {timestamp}_{randomId}_{filename}
```

## Features Included

✅ **File Upload**: Upload files directly to Bunny CDN storage
✅ **File Download**: Download files via CDN URLs for fast access
✅ **File Organization**: Automatic folder structure by collaboration and task
✅ **Unique Filenames**: Prevents filename conflicts with timestamps and random IDs
✅ **Error Handling**: Comprehensive error handling and logging
✅ **File Metadata**: Track file size, type, and upload information

## Security Considerations

1. **Access Control**: Files are organized by collaboration, but consider implementing additional access controls if needed
2. **File Validation**: The system validates file types and sizes on the client side
3. **CDN Security**: Consider enabling Bunny CDN's security features like token authentication if needed

## Troubleshooting

### Common Issues:

1. **"Bunny CDN configuration is incomplete"**
   - Check that all environment variables are set correctly
   - Verify the storage zone name and password

2. **"Upload failed: 401 Unauthorized"**
   - Verify your storage zone password is correct
   - Check that the storage zone is active

3. **"Upload failed: 404 Not Found"**
   - Verify your storage zone name is correct
   - Check that the storage zone exists in your dashboard

4. **Files not accessible via CDN URL**
   - Verify your CDN URL is correct
   - Check that the Pull Zone is properly configured
   - Ensure the storage zone is connected to the Pull Zone

### Debug Mode:

Add `BUNNY_DEBUG=true` to your environment variables to enable detailed logging for file operations.

## Cost Optimization

1. **Storage Costs**: Bunny CDN charges for storage used
2. **Bandwidth Costs**: CDN bandwidth usage is charged
3. **Request Costs**: API requests to storage are charged
4. **Optimization Tips**:
   - Use appropriate file compression
   - Implement file cleanup for old/unused files
   - Consider file size limits for uploads

## Support

For Bunny CDN specific issues, refer to:
- [Bunny CDN Documentation](https://docs.bunny.net/)
- [Bunny CDN Storage API](https://docs.bunny.net/docs/storage-api)
- [Bunny CDN Support](https://bunny.net/support)
