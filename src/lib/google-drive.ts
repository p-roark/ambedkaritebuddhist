/**
 * Google Drive utility functions for fetching images from public Drive folders.
 *
 * Requirements:
 *   - The folder must be shared as "Anyone with the link can view"
 *   - GOOGLE_DRIVE_API_KEY env variable must be set with a key that has
 *     the Drive API enabled in your Google Cloud project
 */

export interface DriveImage {
  id: string;
  name: string;
}

/**
 * Extracts the folder ID from a Google Drive folder URL.
 * Handles formats such as:
 *   https://drive.google.com/drive/folders/FOLDER_ID
 *   https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
 */
export function extractFolderIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('drive.google.com')) return null;
    const match = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validates whether a string is a plausible Google Drive folder URL.
 */
export function isGoogleDriveFolderUrl(url: string): boolean {
  return extractFolderIdFromUrl(url) !== null;
}

/**
 * Fetches the list of image files in a public Google Drive folder via
 * the Drive REST API (v3). Results are cached for 10 minutes via
 * Next.js fetch cache.
 *
 * Returns an empty array if:
 *   - The API key is not configured
 *   - The folder is not publicly accessible
 *   - Any network or API error occurs
 */
export async function getGoogleDriveFolderImages(folderId: string): Promise<DriveImage[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_DRIVE_API_KEY is not set; cannot fetch Drive images');
    return [];
  }

  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType contains 'image/'`);
  const fields = encodeURIComponent('files(id,name)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&key=${apiKey}&fields=${fields}&pageSize=100&orderBy=name`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 600 }, // cache for 10 minutes
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Drive API error ${response.status}:`, text);
      return [];
    }

    const data = (await response.json()) as { files?: Array<{ id: string; name: string }> };
    return (data.files ?? []).map((f) => ({ id: f.id, name: f.name }));
  } catch (error) {
    console.error('Failed to fetch Google Drive folder images:', error);
    return [];
  }
}
