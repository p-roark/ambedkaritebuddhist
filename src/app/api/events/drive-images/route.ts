import { NextRequest, NextResponse } from 'next/server';
import { extractFolderIdFromUrl, getGoogleDriveFolderImages } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/drive-images?folderId=FOLDER_ID
 *   — or —
 * GET /api/events/drive-images?folderUrl=https://drive.google.com/drive/folders/...
 *
 * Server-side proxy for the Google Drive API. Keeps the API key server-side
 * and enables Next.js response caching.
 *
 * Returns: { images: Array<{ id: string; name: string }> }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  let folderId = searchParams.get('folderId');

  // Allow passing the full folder URL instead of just the ID
  if (!folderId) {
    const folderUrl = searchParams.get('folderUrl');
    if (folderUrl) {
      folderId = extractFolderIdFromUrl(folderUrl);
    }
  }

  if (!folderId) {
    return NextResponse.json({ error: 'Missing folderId or folderUrl parameter' }, { status: 400 });
  }

  // Basic sanity check on the folder ID format (alphanumeric + dash/underscore)
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
  }

  const images = await getGoogleDriveFolderImages(folderId);

  return NextResponse.json({ images }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
    },
  });
}
