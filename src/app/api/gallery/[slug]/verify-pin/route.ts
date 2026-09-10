import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPin, signGalleryToken, GALLERY_COOKIE_PREFIX } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    // Rate limiting key by client IP and gallery slug
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local-client';
    const rateLimitKey = `pin:${slug}:${clientIp}`;

    const limit = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many incorrect attempts. Please wait ${Math.ceil(limit.resetInSeconds / 60)} minute(s) before trying again.`,
          retryAfter: limit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
      include: {
        event: { select: { name: true } },
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

    const isValid = await verifyPin(pin.toString().trim(), gallery.pinHash);

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Incorrect gallery PIN. Access denied.',
          remainingAttempts: limit.remaining,
        },
        { status: 401 }
      );
    }

    // Reset rate limit upon successful PIN entry
    resetRateLimit(rateLimitKey);

    // Issue short-lived scoped token for this gallery
    const galleryToken = signGalleryToken({
      galleryId: gallery.id,
      slug: gallery.slug,
    });

    const response = NextResponse.json({
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        eventName: gallery.event.name,
      },
      message: 'PIN verified successfully',
    });

    response.cookies.set(`${GALLERY_COOKIE_PREFIX}${slug}`, galleryToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/`,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
  }
}
