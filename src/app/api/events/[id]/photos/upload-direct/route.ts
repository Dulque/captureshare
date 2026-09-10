import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, checkEventAccess } from '@/lib/auth';
import { saveLocalFile } from '@/lib/storage';

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

    const { searchParams } = new URL(req.url);
    const storageKey = searchParams.get('key');
    if (!storageKey) {
      return NextResponse.json({ error: 'Storage key required' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await saveLocalFile(storageKey, buffer);

    return NextResponse.json({
      success: true,
      storageKey,
      publicUrl,
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json({ error: 'Failed to write uploaded file' }, { status: 500 });
  }
}
