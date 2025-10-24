/**
 * Bunny CDN Storage Integration
 * 
 * This utility provides functions to upload, manage, and delete files using Bunny CDN's storage API.
 * Bunny CDN offers both CDN and storage services, making it perfect for file storage with global distribution.
 */

interface BunnyCdnConfig {
  storageZoneName: string;
  storageZonePassword: string;
  storageZoneRegion: string; // e.g., 'ny', 'la', 'sg', 'syd', 'fra', 'sao'
  cdnUrl: string; // Your CDN URL for file access (e.g., https://trackr-cloud-net.b-cdn.net)
}

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
  lastModified: string;
}

class BunnyCdnStorage {
  private config: BunnyCdnConfig;

  constructor(config: BunnyCdnConfig) {
    this.config = config;
  }

  /**
   * Upload a file to Bunny CDN Storage with organized structure
   */
  async uploadFile(
    file: File, 
    folder: string = 'uploads',
    customFileName?: string,
    clientName?: string,
    projectName?: string
  ): Promise<UploadResult> {
    try {
      // Generate a unique filename to prevent conflicts
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = customFileName || `${timestamp}_${randomId}_${sanitizedName}`;
      
      // Create organized file path structure
      let filePath: string;
      if (clientName && projectName) {
        // Sanitize names for folder structure
        const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `clients/${sanitizedClientName}/projects/${sanitizedProjectName}/${folder}/${fileName}`;
      } else {
        // Fallback to original structure
        filePath = `${folder}/${fileName}`;
      }
      
      // Convert file to buffer
      const fileBuffer = await file.arrayBuffer();
      
      // Bunny CDN Storage API endpoint - try the FTP-style endpoint from your dashboard
      const uploadUrl = `https://la.storage.bunnycdn.com/${this.config.storageZoneName}/${filePath}`;
      
      // Upload the file using the correct Bunny CDN Storage API authentication
      // Based on Bunny CDN documentation, we need to use the storage zone password as AccessKey
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.storageZonePassword,
          'Content-Type': file.type
        },
        body: fileBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bunny CDN upload failed:', response.status, errorText);
        return {
          success: false,
          error: `Upload failed: ${response.status} ${errorText}`
        };
      }

      // Return the public CDN URL
      const publicUrl = `${this.config.cdnUrl}/${filePath}`;
      
      return {
        success: true,
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Bunny CDN upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete a file from Bunny CDN Storage
   */
  async deleteFile(filePath: string): Promise<UploadResult> {
    try {
      const deleteUrl = `https://la.storage.bunnycdn.com/${this.config.storageZoneName}/${filePath}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.storageZonePassword
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bunny CDN delete failed:', response.status, errorText);
        return {
          success: false,
          error: `Delete failed: ${response.status} ${errorText}`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Bunny CDN delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }

  /**
   * Get file metadata from Bunny CDN Storage
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    try {
      const metadataUrl = `https://la.storage.bunnycdn.com/${this.config.storageZoneName}/${filePath}`;
      
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'AccessKey': this.config.storageZonePassword
        }
      });

      if (!response.ok) {
        return null;
      }

      const metadata = await response.json();
      return {
        name: metadata.ObjectName || filePath.split('/').pop() || 'Unknown',
        size: metadata.Length || 0,
        mimeType: metadata.ContentType || 'application/octet-stream',
        lastModified: metadata.LastChanged || new Date().toISOString()
      };

    } catch (error) {
      console.error('Bunny CDN metadata error:', error);
      return null;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string = 'uploads'): Promise<FileMetadata[]> {
    try {
      const listUrl = `https://la.storage.bunnycdn.com/${this.config.storageZoneName}/${folder}/`;
      
      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'AccessKey': this.config.storageZonePassword
        }
      });

      if (!response.ok) {
        return [];
      }

      const files = await response.json();
      return files.map((file: any) => ({
        name: file.ObjectName || 'Unknown',
        size: file.Length || 0,
        mimeType: file.ContentType || 'application/octet-stream',
        lastModified: file.LastChanged || new Date().toISOString()
      }));

    } catch (error) {
      console.error('Bunny CDN list files error:', error);
      return [];
    }
  }

  /**
   * Generate a signed URL for private file access (if needed)
   * Note: Bunny CDN doesn't have built-in signed URLs, but you can implement
   * your own token-based access control if needed
   */
  generatePublicUrl(filePath: string): string {
    return `${this.config.cdnUrl}/${filePath}`;
  }
}

// Create a singleton instance
let bunnyCdnInstance: BunnyCdnStorage | null = null;

/**
 * Get or create the Bunny CDN storage instance
 */
export function getBunnyCdnStorage(): BunnyCdnStorage {
  if (!bunnyCdnInstance) {
    const config: BunnyCdnConfig = {
      storageZoneName: import.meta.env.BUNNY_STORAGE_ZONE_NAME || '',
      storageZonePassword: import.meta.env.BUNNY_STORAGE_ZONE_PASSWORD || '',
      storageZoneRegion: import.meta.env.BUNNY_STORAGE_ZONE_REGION || 'ny',
      cdnUrl: import.meta.env.BUNNY_CDN_URL || ''
    };

    if (!config.storageZoneName || !config.storageZonePassword || !config.cdnUrl) {
      throw new Error('Bunny CDN configuration is incomplete. Please check your environment variables.');
    }

    bunnyCdnInstance = new BunnyCdnStorage(config);
  }

  return bunnyCdnInstance;
}

/**
 * Upload a file to Bunny CDN (convenience function)
 */
export async function uploadToBunnyCdn(
  file: File, 
  folder: string = 'uploads',
  customFileName?: string,
  clientName?: string,
  projectName?: string
): Promise<UploadResult> {
  const storage = getBunnyCdnStorage();
  return await storage.uploadFile(file, folder, customFileName, clientName, projectName);
}

/**
 * Delete a file from Bunny CDN (convenience function)
 */
export async function deleteFromBunnyCdn(filePath: string): Promise<UploadResult> {
  const storage = getBunnyCdnStorage();
  return await storage.deleteFile(filePath);
}

/**
 * Get file metadata from Bunny CDN (convenience function)
 */
export async function getBunnyCdnFileMetadata(filePath: string): Promise<FileMetadata | null> {
  const storage = getBunnyCdnStorage();
  return await storage.getFileMetadata(filePath);
}

/**
 * Generate a public URL for a file (convenience function)
 */
export function getBunnyCdnPublicUrl(filePath: string): string {
  const storage = getBunnyCdnStorage();
  return storage.generatePublicUrl(filePath);
}

export type { BunnyCdnConfig, UploadResult, FileMetadata };
