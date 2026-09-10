import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getGallerySession, getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            eventDate: true,
          },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    if (!gallery.isPublished) {
      return NextResponse.json(
        { error: 'This gallery has not been published yet' },
        { status: 403 }
      );
    }

    // Check customer PIN session OR admin credentials
    const gallerySession = await getGallerySession(slug, req);
    const user = await getSessionUser(req);

    const isAuthorized = Boolean(
      (gallerySession && gallerySession.slug === slug) ||
      (user && user.role === 'ADMIN')
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'PIN verification required to access this gallery' },
        { status: 401 }
      );
    }

    // Retrieve only photos selected and published for this gallery
    const galleryPhotos = await prisma.galleryPhoto.findMany({
      where: { galleryId: gallery.id },
      include: {
        photo: {
          select: {
            id: true,
            filename: true,
            storageKey: true,
            storageUrl: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const photos = galleryPhotos.map((gp) => gp.photo);

    return NextResponse.json({
      gallery: {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        eventName: gallery.event.name,
        eventDescription: gallery.event.description,
        eventDate: gallery.event.eventDate,
      },
      photos,
      totalPhotos: photos.length,
    });
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    return NextResponse.json({ error: 'Failed to retrieve gallery photos' }, { status: 500 });
  }
}
