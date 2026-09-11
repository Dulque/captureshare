/**
 * Comprehensive Live E2E Integration Test Suite for CaptureShare
 * Tests all live HTTP endpoints, role authorizations, edge cases, and security boundaries.
 */

const BASE_URL = 'http://localhost:3000';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

async function runLiveE2ETests() {
  console.log('\n=============================================================');
  console.log('🚀 CaptureShare Comprehensive Live E2E Integration Test Suite');
  console.log('   Target: ' + BASE_URL);
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  async function step(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✓ [TEST ${total}] ${name}`);
    } catch (err: any) {
      console.error(`  ✗ [TEST ${total}] ${name}`);
      console.error(`    ↳ Error: ${err.message}\n`);
      throw err; // fail-fast to ensure exact debugging
    }
  }

  const timestamp = Date.now();
  let adminToken = '';
  let member1Token = '';
  let member2Token = ''; // Unassigned member to test tenant isolation
  let adminCookie = '';
  let member1Cookie = '';
  let member2Cookie = '';
  let testEventId = '';
  let uploadedPhotoIds: string[] = [];
  let testGallerySlug = '';
  const testGalleryPin = '928374';

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & INPUT VALIDATION
  // -------------------------------------------------------------
  console.log('📦 Section 1: Authentication & Input Validation');

  await step('Reject registration when required fields are missing (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: 'short', name: '' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.error), 'Expected error message in response');
  });

  await step('Reject registration when password is under 6 characters (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test_${timestamp}@demo.com`, password: '123', name: 'User' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Register new Admin user successfully (200 OK + JWT Cookie)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin_${timestamp}@captureshare.com`,
        password: 'AdminPassword123!',
        name: 'E2E Test Admin',
        role: 'ADMIN',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.role === 'ADMIN', 'Expected user role to be ADMIN');
    adminToken = data.token;
    const cookieHeader = res.headers.get('set-cookie');
    assert(Boolean(cookieHeader), 'Expected set-cookie header with session token');
    adminCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  });

  await step('Reject duplicate email registration with 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin_${timestamp}@captureshare.com`,
        password: 'AnotherPassword123!',
        name: 'Duplicate Admin',
        role: 'ADMIN',
      }),
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
  });

  await step('Register Team Member 1 (assigned photographer)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `photographer1_${timestamp}@captureshare.com`,
        password: 'MemberPassword123!',
        name: 'Photographer 1',
        role: 'TEAM_MEMBER',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.role === 'TEAM_MEMBER', 'Expected role TEAM_MEMBER');
    member1Token = data.token;
    const cookie = res.headers.get('set-cookie');
    member1Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Register Team Member 2 (unassigned photographer for tenant isolation testing)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `photographer2_${timestamp}@captureshare.com`,
        password: 'MemberPassword123!',
        name: 'Photographer 2',
        role: 'TEAM_MEMBER',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    member2Token = data.token;
    const cookie = res.headers.get('set-cookie');
    member2Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Reject login with invalid password (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin_${timestamp}@captureshare.com`,
        password: 'WrongPassword!',
      }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Verify /api/auth/me returns current user identity from cookie session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.email === `admin_${timestamp}@captureshare.com`, 'Session email mismatch');
    assert(data.user.role === 'ADMIN', 'Session role mismatch');
  });

  // -------------------------------------------------------------
  // 2. ROLE-BASED ACCESS CONTROL & EVENT MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n📦 Section 2: Role-Based Event Operations & Isolation');

  await step('Team Member CANNOT create an event (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({ name: 'Unauthorized Gala' }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Admin CAN create an event (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: `E2E Wedding & Reception ${timestamp}`,
        description: 'Grand test event for multi-user photo sharing',
        eventDate: '2026-10-15',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.event.id), 'Expected created event to have an ID');
    testEventId = data.event.id;
  });

  await step('Admin adds Team Member 1 to the event', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ email: `photographer1_${timestamp}@captureshare.com` }),
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
  });

  await step('Team Member CANNOT add other members to event (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({ email: `photographer2_${timestamp}@captureshare.com` }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('SPEC SCENARIO 1: Unassigned Team Member attempting to access another event (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}`, {
      headers: { Cookie: member2Cookie },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Forbidden'), 'Expected Forbidden error message');
  });

  await step('Assigned Team Member CAN access their assigned event (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}`, {
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.event.id === testEventId, 'Expected event ID to match');
  });

  // -------------------------------------------------------------
  // 3. PHOTO UPLOAD, OBJECT STORAGE & METADATA CONFIRMATION
  // -------------------------------------------------------------
  console.log('\n📦 Section 3: Photo Uploads & Object Storage Integration');

  await step('SPEC SCENARIO 3: Reject upload presign request with empty files payload (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/presign-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({ files: [] }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  await step('Unassigned user CANNOT request photo upload presigned URLs (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/presign-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member2Cookie,
      },
      body: JSON.stringify({
        files: [{ filename: 'hacker_shot.jpg', mimeType: 'image/jpeg' }],
      }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  let presignedTargets: any[] = [];
  await step('Assigned Team Member generates multi-photo upload presigned targets', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/presign-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({
        files: [
          { filename: 'ceremony_01.jpg', mimeType: 'image/jpeg' },
          { filename: 'rings_macro_02.jpg', mimeType: 'image/jpeg' },
          { filename: 'candid_dance_03.jpg', mimeType: 'image/jpeg' },
        ],
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.uploads.length === 3, 'Expected 3 upload targets');
    assert(Boolean(data.uploads[0].uploadUrl), 'Expected upload URL');
    assert(Boolean(data.uploads[0].storageKey), 'Expected storageKey');
    presignedTargets = data.uploads;
  });

  await step('Record photo metadata in database after upload (Section 4 Requirements)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({
        photos: [
          {
            filename: 'ceremony_01.jpg',
            storageKey: presignedTargets[0].storageKey,
            storageUrl: presignedTargets[0].publicUrl,
            fileSize: 4200100,
            mimeType: 'image/jpeg',
          },
          {
            filename: 'rings_macro_02.jpg',
            storageKey: presignedTargets[1].storageKey,
            storageUrl: presignedTargets[1].publicUrl,
            fileSize: 3100500,
            mimeType: 'image/jpeg',
          },
          {
            filename: 'candid_dance_03.jpg',
            storageKey: presignedTargets[2].storageKey,
            storageUrl: presignedTargets[2].publicUrl,
            fileSize: 5600800,
            mimeType: 'image/jpeg',
          },
        ],
      }),
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert(data.photos.length === 3, 'Expected 3 photos recorded');
    uploadedPhotoIds = data.photos.map((p: any) => p.id);
  });

  // -------------------------------------------------------------
  // 4. ADMIN PHOTO CURATION & OPERATIONAL STATE VERIFICATION
  // -------------------------------------------------------------
  console.log('\n📦 Section 4: Admin Photo Curation & Operational State');

  await step('Team Member CANNOT select/curate photos for gallery (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({
        photoIds: [uploadedPhotoIds[0]],
        isSelected: true,
      }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Admin selects 2 out of 3 photos for sharing', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/photos/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        photoIds: [uploadedPhotoIds[0], uploadedPhotoIds[1]],
        isSelected: true,
      }),
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 2, `Expected 2 selected photos, got ${data.selectedCount}`);
  });

  await step('Verify Operational State counts in Event Details: Total Uploaded: 3 | Selected: 2', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}`, {
      headers: { Cookie: adminCookie },
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.stats.totalUploadedPhotos === 3, `Expected total 3, got ${data.stats.totalUploadedPhotos}`);
    assert(data.stats.selectedPhotosCount === 2, `Expected selected 2, got ${data.stats.selectedPhotosCount}`);
  });

  // -------------------------------------------------------------
  // 5. GALLERY PUBLISHING WORKFLOW & PIN ENCRYPTION
  // -------------------------------------------------------------
  console.log('\n📦 Section 5: Gallery Publishing & Security Workflows');

  await step('SPEC SCENARIO 2: Team Member attempting to publish a gallery (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: member1Cookie,
      },
      body: JSON.stringify({
        title: 'Unauthorized Gallery',
        pin: '123456',
        isPublished: true,
      }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Reject gallery creation with invalid PIN length (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: 'Test Gallery',
        pin: '12', // too short
        isPublished: true,
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  await step('Admin publishes Gallery and generates Access PIN + Shareable URL', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${testEventId}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: 'Wedding Highlights Gallery',
        pin: testGalleryPin,
        isPublished: true,
      }),
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.gallery.slug), 'Expected gallery slug');
    assert(data.accessPin === testGalleryPin, 'Expected accessPin returned in response');
    testGallerySlug = data.gallery.slug;
  });

  // -------------------------------------------------------------
  // 6. CUSTOMER ACCESS, PIN VERIFICATION & BRUTE-FORCE RATE LIMITING
  // -------------------------------------------------------------
  console.log('\n📦 Section 6: Customer Access, PIN Protection & Brute-Force Rate Limiting');

  await step('SPEC SCENARIO 5: Customer cannot view photos without entering correct PIN (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${testGallerySlug}/photos`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('PIN verification required'), 'Expected PIN required message');
  });

  await step('SPEC SCENARIO 4: Entering incorrect gallery PIN fails with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${testGallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '000000' }),
    });
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Incorrect gallery PIN'), 'Expected incorrect PIN message');
    assert(data.remainingAttempts !== undefined, 'Expected remainingAttempts counter');
  });

  let customerCookie = '';
  await step('Customer enters correct PIN: returns 200 OK and sets HTTP-only gallery session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${testGallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: testGalleryPin }),
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), 'Expected set-cookie header');
    assert(cookie!.includes('captureshare_gallery_'), 'Expected gallery cookie name');
    customerCookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('SPEC SCENARIO 5: Customer with valid PIN session views ONLY selected & published photos', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${testGallerySlug}/photos`, {
      headers: { Cookie: customerCookie },
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert(data.photos.length === 2, `Expected exactly 2 selected photos, got ${data.photos.length}`);
    // Confirm the unselected photo is NOT leaked
    const hasUnselected = data.photos.some((p: any) => p.id === uploadedPhotoIds[2]);
    assert(!hasUnselected, 'Unpublished / unselected photo leaked to customer!');
  });

  await step('Brute-force test: Rapid incorrect attempts trigger HTTP 429 Too Many Requests', async () => {
    const uniqueSlug = `lockout_test_${timestamp}`;
    // Simulate 5 bad attempts on rate limiter endpoint
    let hitRateLimit = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/gallery/${uniqueSlug}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `192.168.100.${timestamp % 200}`,
        },
        body: JSON.stringify({ pin: '999999' }),
      });
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    assert(hitRateLimit, 'Rate limiter failed to block after repeated incorrect attempts');
  });

  console.log('\n=============================================================');
  console.log(`🎉 ALL ${passed}/${total} LIVE E2E INTEGRATION TESTS PASSED (100%)`);
  console.log('=============================================================\n');
}

runLiveE2ETests().catch((err) => {
  console.error('\n❌ E2E Integration Suite Encountered Failure:', err);
  process.exit(1);
});
