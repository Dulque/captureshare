import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getSessionUser, hashPin } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gallery = await prisma.gallery.findFirst({
      where: { eventId: params.id },
      include: {
        _count: { select: { photos: true } },
      },
    });

    return NextResponse.json({ gallery });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve gallery' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification: Only Admin can publish galleries
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Admins can create and publish galleries' },
        { status: 403 }
      );
    }

    const { title, pin, isPublished, customSlug } = await req.json();

    if (!pin || pin.toString().length < 4 || pin.toString().length > 8) {
      return NextResponse.json(
        { error: 'A valid PIN (4 to 8 digits) is required' },
        { status: 400 }
      );
    }

    const pinStr = pin.toString().trim();
    const pinHash = await hashPin(pinStr);

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          where: { isSelected: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if gallery already exists for event
    let gallery = await prisma.gallery.findFirst({
      where: { eventId: params.id },
    });

    const slug = customSlug?.trim() || gallery?.slug || crypto.randomBytes(4).toString('hex');
    const galleryTitle = title?.trim() || gallery?.title || `${event.name} Gallery`;

    if (gallery) {
      gallery = await prisma.gallery.update({
        where: { id: gallery.id },
        data: {
          title: galleryTitle,
          pinHash,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
          slug,
        },
      });
    } else {
      gallery = await prisma.gallery.create({
        data: {
          eventId: params.id,
          title: galleryTitle,
          pinHash,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
          slug,
        },
      });
    }

    // Associate all currently selected photos to the gallery
    const selectedPhotos = event.photos;
    if (selectedPhotos.length > 0) {
      // Clear existing associations and re-sync
      await prisma.galleryPhoto.deleteMany({
        where: { galleryId: gallery.id },
      });

      await prisma.galleryPhoto.createMany({
        data: selectedPhotos.map((photo) => ({
          galleryId: gallery!.id,
          photoId: photo.id,
        })),
        // Prisma SQLite handles createMany in newer versions
      });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const galleryUrl = `${origin}/gallery/${gallery.slug}`;

    return NextResponse.json({
      gallery,
      galleryUrl,
      accessPin: pinStr,
      selectedCount: selectedPhotos.length,
      message: 'Gallery published successfully',
    });
  } catch (error) {
    console.error('Error publishing gallery:', error);
    return NextResponse.json({ error: 'Failed to publish gallery' }, { status: 500 });
  }
}
