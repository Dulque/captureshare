import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, checkEventAccess } from '@/lib/auth';

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
    const photosToInsert: Array<{
      filename: string;
      storageKey: string;
      storageUrl: string;
      fileSize: number;
      mimeType?: string;
    }> = Array.isArray(body.photos) ? body.photos : [body];

    if (photosToInsert.length === 0 || !photosToInsert[0].storageKey) {
      return NextResponse.json({ error: 'Valid photo details required' }, { status: 400 });
    }

    const createdPhotos = await Promise.all(
      photosToInsert.map((p) =>
        prisma.photo.create({
          data: {
            eventId,
            uploadedById: user.id,
            filename: p.filename,
            storageKey: p.storageKey,
            storageUrl: p.storageUrl,
            fileSize: p.fileSize || 0,
            mimeType: p.mimeType || 'image/jpeg',
            isSelected: false,
          },
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
        })
      )
    );

    return NextResponse.json({
      photos: createdPhotos,
      message: `${createdPhotos.length} photo(s) recorded successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error confirming photo upload:', error);
    return NextResponse.json({ error: 'Failed to record photo metadata' }, { status: 500 });
  }
}
