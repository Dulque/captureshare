import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  signUserToken,
  verifyUserToken,
  signGalleryToken,
  verifyGalleryToken,
} from '@/lib/auth';

describe('Authentication & Security Helpers', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('should hash and verify PINs correctly', async () => {
    const pin = '482917';
    const hash = await hashPin(pin);

    expect(hash).not.toBe(pin);
    expect(await verifyPin(pin, hash)).toBe(true);
    expect(await verifyPin('111111', hash)).toBe(false);
  });

  it('should sign and verify valid user tokens', () => {
    const user = {
      id: 'usr_123',
      email: 'admin@trizen.com',
      name: 'Admin Test',
      role: 'ADMIN' as const,
    };

    const token = signUserToken(user);
    const decoded = verifyUserToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(user.id);
    expect(decoded?.email).toBe(user.email);
    expect(decoded?.role).toBe('ADMIN');
  });

  it('should sign and verify customer gallery access tokens', () => {
    const session = {
      galleryId: 'gal_abc123',
      slug: 'abc123',
    };

    const token = signGalleryToken(session);
    const decoded = verifyGalleryToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.galleryId).toBe(session.galleryId);
    expect(decoded?.slug).toBe('abc123');
  });

  it('should reject invalid or tampered tokens', () => {
    expect(verifyUserToken('invalid.token.string')).toBeNull();
    expect(verifyGalleryToken('tampered.gallery.token')).toBeNull();
  });
});
