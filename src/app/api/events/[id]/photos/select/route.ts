import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role enforcement: Only Admin can select photos for gallery
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Admins can select photos for gallery publishing' },
        { status: 403 }
      );
    }

    const { photoIds, isSelected } = await req.json();

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'photoIds array is required' }, { status: 400 });
    }

    await prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        eventId: params.id,
      },
      data: {
        isSelected: Boolean(isSelected),
      },
    });

    const totalSelected = await prisma.photo.count({
      where: {
        eventId: params.id,
        isSelected: true,
      },
    });

    return NextResponse.json({
      success: true,
      selectedCount: totalSelected,
      message: `Updated selection for ${photoIds.length} photo(s)`,
    });
  } catch (error) {
    console.error('Error toggling photo selection:', error);
    return NextResponse.json({ error: 'Failed to update selection' }, { status: 500 });
  }
}
