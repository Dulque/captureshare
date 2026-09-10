import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { hashPassword, hashPin, verifyPin } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('Gallery Publishing & PIN Verification Workflows', () => {
  let admin: any;
  let event: any;
  let publishedGallery: any;
  let draftGallery: any;
  const CORRECT_PIN = '482917';

  beforeAll(async () => {
    const pw = await hashPassword('Pass123!');
    admin = await prisma.user.create({
      data: {
        email: `gallery_admin_${Date.now()}@test.com`,
        name: 'Gallery Admin',
        passwordHash: pw,
        role: 'ADMIN',
      },
    });

    event = await prisma.event.create({
      data: {
        name: 'Annual Tech Summit',
        adminId: admin.id,
      },
    });

    const pinHash = await hashPin(CORRECT_PIN);

    publishedGallery = await prisma.gallery.create({
      data: {
        eventId: event.id,
        title: 'Tech Summit Highlights',
        slug: `summit_${Date.now()}`,
        pinHash,
        isPublished: true,
      },
    });

    draftGallery = await prisma.gallery.create({
      data: {
        eventId: event.id,
        title: 'Draft Private Gallery',
        slug: `draft_${Date.now()}`,
        pinHash,
        isPublished: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.gallery.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.user.delete({ where: { id: admin.id } });
    await prisma.$disconnect();
  });

  it('verifies correct PIN successfully', async () => {
    const isCorrect = await verifyPin(CORRECT_PIN, publishedGallery.pinHash);
    expect(isCorrect).toBe(true);
  });

  it('rejects incorrect PIN', async () => {
    const isCorrect = await verifyPin('000000', publishedGallery.pinHash);
    expect(isCorrect).toBe(false);
  });

  it('enforces rate limiting after 5 consecutive incorrect attempts', () => {
    const testKey = `pin:test-gallery:${Date.now()}`;

    // 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testKey, 5, 60000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt should be blocked
    const blockedRes = checkRateLimit(testKey, 5, 60000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetInSeconds).toBeGreaterThan(0);

    // Resetting works
    resetRateLimit(testKey);
    const retryRes = checkRateLimit(testKey, 5, 60000);
    expect(retryRes.allowed).toBe(true);
  });

  it('flags draft galleries as unpublished', async () => {
    const gal = await prisma.gallery.findUnique({
      where: { id: draftGallery.id },
    });
    expect(gal?.isPublished).toBe(false);
  });
});
