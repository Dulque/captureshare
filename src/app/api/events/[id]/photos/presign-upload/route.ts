import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, checkEventAccess } from '@/lib/auth';
import { getUploadUrl } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const hasAccess = await checkEventAccess(eventId, user);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this event' }, { status: 403 });
    }

    const body = await req.json();
    // Accept either a single file { filename, fileSize, mimeType } or array files: [...]
    const files: Array<{ filename: string; mimeType: string }> = Array.isArray(body.files)
      ? body.files
      : [{ filename: body.filename, mimeType: body.mimeType }];

    if (!files || files.length === 0 || !files[0].filename) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    const presignedResults = await Promise.all(
      files.map(async (file) => {
        const uploadTarget = await getUploadUrl(
          eventId,
          file.filename,
          file.mimeType || 'image/jpeg'
        );
        return {
          filename: file.filename,
          ...uploadTarget,
        };
      })
    );

    return NextResponse.json({
      uploads: presignedResults,
    });
  } catch (error) {
    console.error('Error generating presigned upload URLs:', error);
    return NextResponse.json({ error: 'Failed to prepare uploads' }, { status: 500 });
  }
}
