import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let events;

    if (user.role === 'ADMIN') {
      // Admin sees all events or events they manage
      events = await prisma.event.findMany({
        where: { adminId: user.id },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
          galleries: {
            select: { id: true, title: true, slug: true, isPublished: true },
          },
          _count: {
            select: { photos: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Team member only sees events they are assigned to
      const memberships = await prisma.eventMember.findMany({
        where: { userId: user.id },
        include: {
          event: {
            include: {
              admin: { select: { id: true, name: true, email: true } },
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
              _count: {
                select: { photos: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      events = memberships.map((m) => m.event);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only Admin can create an event
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Admins can create events' },
        { status: 403 }
      );
    }

    const { name, description, eventDate } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        adminId: user.id,
      },
    });

    return NextResponse.json({ event, message: 'Event created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
