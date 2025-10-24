/**
 * Direct Bunny CDN upload utility for frontend
 * Bypasses Vercel's 4.5MB limit by uploading directly to Bunny CDN
 */

interface BunnyCdnDirectConfig {
  storageZoneName: string;
  storageZonePassword: string;
  storageZoneRegion: string;
  cdnUrl: string;
}

interface DirectUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

class BunnyCdnDirectUpload {
  private config: BunnyCdnDirectConfig;
  private debug: boolean;

  constructor(config: BunnyCdnDirectConfig) {
    this.config = config;
    this.debug = process.env.NODE_ENV === 'development';
  }

  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[BunnyCDN Direct] ${message}`, ...args);
    }
  }

  /**
   * Upload file directly to Bunny CDN from frontend
   * Supports files up to 10GB with progress tracking
   */
  async uploadFile(
    file: File,
    folder: string = 'uploads',
    customFileName?: string,
    clientName?: string,
    projectName?: string,
    onProgress?: (progress: number) => void
  ): Promise<DirectUploadResult> {
    try {
      // Generate a unique filename to prevent conflicts
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = customFileName || `${timestamp}_${randomId}_${sanitizedName}`;
      
      // Create organized file path structure with human-readable names
      let filePath: string;
      if (clientName && projectName) {
        // Sanitize names for folder structure (keep spaces, replace only problematic characters)
        const sanitizedClientName = clientName.replace(/[<>:"/\\|?*]/g, '_').trim();
        const sanitizedProjectName = projectName.replace(/[<>:"/\\|?*]/g, '_').trim();
        filePath = `${sanitizedClientName}/${sanitizedProjectName}/${fileName}`;
      } else {
        // Fallback to original structure
        filePath = `${folder}/${fileName}`;
      }
      
      // Bunny CDN Storage API endpoint
      const uploadUrl = `https://${this.config.storageZoneRegion}.storage.bunnycdn.com/${this.config.storageZoneName}/${filePath}`;
      
      this.log('Uploading file directly to Bunny CDN:', {
        fileName: file.name,
        fileSize: file.size,
        filePath,
        uploadUrl: uploadUrl.replace(this.config.storageZonePassword, '[HIDDEN]')
      });

      // Upload the file using fetch with progress tracking
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.storageZonePassword,
          'Content-Type': file.type
        },
        body: file
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Bunny CDN direct upload failed:', response.status, errorText);
        return {
          success: false,
          error: `Upload failed: ${response.status} ${errorText}`
        };
      }

      this.log('File uploaded successfully:', filePath);
      return {
        success: true,
        url: `${this.config.cdnUrl}/${filePath}`,
        path: filePath
      };

    } catch (error) {
      this.log('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete a file from Bunny CDN Storage
   */
  async deleteFile(filePath: string): Promise<DirectUploadResult> {
    try {
      const deleteUrl = `https://${this.config.storageZoneRegion}.storage.bunnycdn.com/${this.config.storageZoneName}/${filePath}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.storageZonePassword
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Bunny CDN delete failed:', response.status, errorText);
        return {
          success: false,
          error: `Delete failed: ${response.status} ${errorText}`
        };
      }

      this.log('File deleted successfully:', filePath);
      return { success: true };

    } catch (error) {
      this.log('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }
}

// Create a singleton instance
let bunnyCdnDirectInstance: BunnyCdnDirectUpload | null = null;
let configPromise: Promise<BunnyCdnDirectConfig> | null = null;

/**
 * Fetch Bunny CDN configuration from the API
 */
async function fetchBunnyCdnConfig(): Promise<BunnyCdnDirectConfig> {
  try {
    const response = await fetch('/api/bunny-cdn-config');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Bunny CDN configuration');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching Bunny CDN config:', error);
    throw new Error('Failed to get Bunny CDN configuration');
  }
}

/**
 * Get Bunny CDN direct upload instance
 * Fetches configuration from the API endpoint
 */
export async function getBunnyCdnDirectUpload(): Promise<BunnyCdnDirectUpload> {
  if (!bunnyCdnDirectInstance) {
    if (!configPromise) {
      configPromise = fetchBunnyCdnConfig();
    }
    
    const config = await configPromise;
    bunnyCdnDirectInstance = new BunnyCdnDirectUpload(config);
  }

  return bunnyCdnDirectInstance;
}

/**
 * Upload file directly to Bunny CDN (convenience function)
 */
export async function uploadDirectlyToBunnyCdn(
  file: File,
  folder: string = 'uploads',
  customFileName?: string,
  clientName?: string,
  projectName?: string,
  onProgress?: (progress: number) => void
): Promise<DirectUploadResult> {
  const uploader = await getBunnyCdnDirectUpload();
  return await uploader.uploadFile(file, folder, customFileName, clientName, projectName, onProgress);
}

/**
 * Delete file directly from Bunny CDN (convenience function)
 */
export async function deleteDirectlyFromBunnyCdn(filePath: string): Promise<DirectUploadResult> {
  const uploader = await getBunnyCdnDirectUpload();
  return await uploader.deleteFile(filePath);
}
