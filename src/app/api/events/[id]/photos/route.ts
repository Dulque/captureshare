import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, checkEventAccess } from '@/lib/auth';

export async function GET(
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

    // Role-based visibility:
    // Admin can view all photos uploaded by the team
    // Team members can view their uploaded photos (and assigned event view)
    const { searchParams } = new URL(req.url);
    const viewScope = searchParams.get('scope'); // 'mine' or 'all'

    const whereClause: { eventId: string; uploadedById?: string } = { eventId };
    if (user.role !== 'ADMIN' || viewScope === 'mine') {
      whereClause.uploadedById = user.id;
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
