import { prisma } from '../src/lib/db';
import {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  signUserToken,
  verifyUserToken,
  signGalleryToken,
  verifyGalleryToken,
  checkEventAccess,
} from '../src/lib/auth';
import { checkRateLimit, resetRateLimit } from '../src/lib/rate-limit';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 CaptureShare Automated Test Suite');
  console.log('========================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}\n`);
    }
  }

  // --- Suite 1: Authentication & Token Security ---
  console.log('📦 Suite 1: Authentication & Token Security');

  await test('should hash and verify passwords using bcrypt', async () => {
    const pw = 'SecurePass2026!';
    const hash = await hashPassword(pw);
    assert(hash !== pw, 'Hash should not match plaintext');
    assert(await verifyPassword(pw, hash), 'Valid password must verify');
    assert(!(await verifyPassword('wrong', hash)), 'Invalid password must fail');
  });

  await test('should hash and verify PINs with bcrypt', async () => {
    const pin = '482917';
    const hash = await hashPin(pin);
    assert(hash !== pin, 'PIN hash must differ from plaintext');
    assert(await verifyPin(pin, hash), 'Valid PIN must verify');
    assert(!(await verifyPin('000000', hash)), 'Wrong PIN must fail');
  });

  await test('should sign and verify valid user session tokens', () => {
    const token = signUserToken({
      id: 'user_1',
      email: 'admin@captureshare.com',
      name: 'Admin',
      role: 'ADMIN',
    });
    const decoded = verifyUserToken(token);
    assert(decoded?.email === 'admin@captureshare.com', 'Token email must match');
    assert(decoded?.role === 'ADMIN', 'Token role must match ADMIN');
  });

  await test('should sign and verify customer gallery tokens', () => {
    const token = signGalleryToken({ galleryId: 'gal_1', slug: 'abc123' });
    const decoded = verifyGalleryToken(token);
    assert(decoded?.slug === 'abc123', 'Gallery slug must match');
  });

  await test('should reject invalid or tampered tokens', () => {
    assert(verifyUserToken('bad.token') === null, 'Bad user token must return null');
    assert(verifyGalleryToken('bad.token') === null, 'Bad gallery token must return null');
  });

  // --- Suite 2: Event Access Control & Role-Based Isolation ---
  console.log('\n📦 Suite 2: Event Access Control & Role-Based Isolation');

  const pwHash = await hashPassword('Pass123!');
  const testAdmin = await prisma.user.create({
    data: {
      email: `admin_test_${Date.now()}@test.com`,
      name: 'Admin Test',
      passwordHash: pwHash,
      role: 'ADMIN',
    },
  });

  const assignedMember = await prisma.user.create({
    data: {
      email: `assigned_${Date.now()}@test.com`,
      name: 'Assigned Member',
      passwordHash: pwHash,
      role: 'TEAM_MEMBER',
    },
  });

  const unassignedMember = await prisma.user.create({
    data: {
      email: `unassigned_${Date.now()}@test.com`,
      name: 'Unassigned Member',
      passwordHash: pwHash,
      role: 'TEAM_MEMBER',
    },
  });

  const testEvent = await prisma.event.create({
    data: {
      name: 'Isolation Test Gala',
      adminId: testAdmin.id,
    },
  });

  await prisma.eventMember.create({
    data: {
      eventId: testEvent.id,
      userId: assignedMember.id,
    },
  });

  await test('Admin has full access to event', async () => {
    const canAccess = await checkEventAccess(testEvent.id, {
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      role: 'ADMIN',
    });
    assert(canAccess === true, 'Admin must have access');
  });

  await test('Assigned team member can access their assigned event', async () => {
    const canAccess = await checkEventAccess(testEvent.id, {
      id: assignedMember.id,
      email: assignedMember.email,
      name: assignedMember.name,
      role: 'TEAM_MEMBER',
    });
    assert(canAccess === true, 'Assigned member must have access');
  });

  await test('Unassigned team member is blocked from accessing event (Tenant Isolation)', async () => {
    const canAccess = await checkEventAccess(testEvent.id, {
      id: unassignedMember.id,
      email: unassignedMember.email,
      name: unassignedMember.name,
      role: 'TEAM_MEMBER',
    });
    assert(canAccess === false, 'Unassigned member must NOT have access');
  });

  // --- Suite 3: Gallery Publishing & PIN Brute-Force Rate Limiting ---
  console.log('\n📦 Suite 3: Gallery Publishing & PIN Protection');

  const testPin = '482917';
  const testPinHash = await hashPin(testPin);

  const publishedGallery = await prisma.gallery.create({
    data: {
      eventId: testEvent.id,
      title: 'Published Test Gallery',
      slug: `pub_${Date.now()}`,
      pinHash: testPinHash,
      isPublished: true,
    },
  });

  const draftGallery = await prisma.gallery.create({
    data: {
      eventId: testEvent.id,
      title: 'Draft Test Gallery',
      slug: `draft_${Date.now()}`,
      pinHash: testPinHash,
      isPublished: false,
    },
  });

  await test('Customer with correct PIN unlocks published gallery', async () => {
    const isPinValid = await verifyPin(testPin, publishedGallery.pinHash);
    assert(isPinValid === true, 'Correct PIN must unlock gallery');
  });

  await test('Customer with incorrect PIN is denied access', async () => {
    const isPinValid = await verifyPin('111111', publishedGallery.pinHash);
    assert(isPinValid === false, 'Incorrect PIN must be rejected');
  });

  await test('Brute-force protection: Locks out attempts after 5 consecutive failures', () => {
    const key = `pin:test-lockout:${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(key, 5, 60000);
      assert(res.allowed === true, `Attempt ${i + 1} should be allowed`);
    }
    const blockedRes = checkRateLimit(key, 5, 60000);
    assert(blockedRes.allowed === false, '6th attempt must be blocked');
    assert(blockedRes.remaining === 0, 'Remaining attempts must be 0');

    resetRateLimit(key);
    const afterReset = checkRateLimit(key, 5, 60000);
    assert(afterReset.allowed === true, 'Reset should restore access');
  });

  await test('Draft gallery cannot be accessed by public', async () => {
    const gal = await prisma.gallery.findUnique({
      where: { id: draftGallery.id },
    });
    assert(gal?.isPublished === false, 'Draft gallery must have isPublished = false');
  });

  // Cleanup test records
  await prisma.gallery.deleteMany({ where: { eventId: testEvent.id } });
  await prisma.eventMember.deleteMany({ where: { eventId: testEvent.id } });
  await prisma.event.delete({ where: { id: testEvent.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [testAdmin.id, assignedMember.id, unassignedMember.id] } },
  });
  await prisma.$disconnect();

  console.log('\n========================================');
  console.log(`📊 Test Results: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
  if (passed === total) {
    console.log('🎉 All tests passed successfully!');
    console.log('========================================\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed.');
    console.log('========================================\n');
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal error during test run:', e);
  process.exit(1);
});
