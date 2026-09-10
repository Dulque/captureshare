import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';
import { UserSession, GallerySession } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'trizen_super_secret_jwt_key_development_2026';
const TOKEN_COOKIE_NAME = 'trizen_token';
const GALLERY_COOKIE_PREFIX = 'trizen_gallery_';

// Password helpers
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// PIN helpers
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// User JWT helpers
export function signUserToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyUserToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

// Gallery session token helpers (for customers accessing with PIN)
export function signGalleryToken(session: GallerySession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyGalleryToken(token: string): GallerySession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as GallerySession;
    return decoded;
  } catch {
    return null;
  }
}

// Request auth extraction
export async function getSessionUser(req?: NextRequest): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    }
  } else {
    const cookieStore = cookies();
    token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyUserToken(token);
}

export async function getGallerySession(slug: string, req?: NextRequest): Promise<GallerySession | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(`${GALLERY_COOKIE_PREFIX}${slug}`)?.value;
  } else {
    const cookieStore = cookies();
    token = cookieStore.get(`${GALLERY_COOKIE_PREFIX}${slug}`)?.value;
  }

  if (!token) return null;
  const decoded = verifyGalleryToken(token);
  if (decoded && decoded.slug === slug) {
    return decoded;
  }
  return null;
}

// Authorization checks
export async function checkEventAccess(eventId: string, user: UserSession): Promise<boolean> {
  if (user.role === 'ADMIN') {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    return !!event;
  }

  // Team member must be explicitly added to EventMember
  const membership = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId: user.id,
      },
    },
  });

  return !!membership;
}

export { TOKEN_COOKIE_NAME, GALLERY_COOKIE_PREFIX };
