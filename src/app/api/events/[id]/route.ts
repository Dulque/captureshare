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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        galleries: {
          include: {
            _count: { select: { photos: true } },
          },
        },
        photos: {
          where: user.role === 'ADMIN' ? {} : { uploadedById: user.id },
          include: {
            uploadedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Role and membership check
    const isOwner = event.adminId === user.id;
    const isMember = event.members.some((m) => m.user.id === user.id);

    if (user.role === 'ADMIN' ? !isOwner : !isMember) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      );
    }

    const totalUploadedPhotos = await prisma.photo.count({
      where: { eventId },
    });

    const selectedPhotosCount = await prisma.photo.count({
      where: { eventId, isSelected: true },
    });

    return NextResponse.json({
      event,
      stats: {
        totalUploadedPhotos,
        selectedPhotosCount,
      },
    });
  } catch (error) {
    console.error('Error getting event:', error);
    return NextResponse.json({ error: 'Failed to retrieve event' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Admins can delete events' },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.adminId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this event' }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
