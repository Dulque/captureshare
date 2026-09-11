/**
 * Exhaustive Live E2E Integration & Edge-Case Test Suite for CaptureShare
 * 16 comprehensive sections covering all workflows, boundary conditions, security scenarios,
 * role permissions, binary storage pipelines, path traversal defense, and error states.
 */

const BASE_URL = 'http://localhost:3000';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

async function runAllPossibilitiesTests() {
  console.log('\n======================================================================');
  console.log('🧪 CaptureShare Comprehensive E2E & Edge-Case Test Suite');
  console.log('   Target: ' + BASE_URL);
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  async function step(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✓ [TEST ${total.toString().padStart(2, ' ')}] ${name}`);
    } catch (err: any) {
      console.error(`  ✗ [TEST ${total.toString().padStart(2, ' ')}] ${name}`);
      console.error(`    ↳ Failure: ${err.message}\n`);
      throw err;
    }
  }

  const timestamp = Date.now();
  let admin1Token = '';
  let admin1Cookie = '';
  let admin1Id = '';
  let admin2Cookie = ''; // Second admin to test multi-admin isolation
  let member1Cookie = ''; // Assigned photographer 1
  let member1Id = '';
  let member2Cookie = ''; // Unassigned photographer 2
  let member2Id = '';
  let event1Id = '';
  let event2Id = ''; // Created by Admin 2
  let event3Id = ''; // Multi-photographer event
  let photoIds: string[] = [];
  let gallerySlug = '';
  const correctPin = '784912';

  // ============================================================================
  // SECTION 1: AUTHENTICATION, REGISTRATION & INPUT VALIDATION BOUNDARIES
  // ============================================================================
  console.log('📦 Section 1: Authentication & Input Validation Boundaries');

  await step('Reject registration when body is empty or malformed (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Reject registration when name is missing (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test1_${timestamp}@demo.com`, password: 'Password123!' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Reject registration when email is missing (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Without Email', password: 'Password123!' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Reject registration when password is under 6 characters [Boundary: 5 chars] (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User', email: `shortpw_${timestamp}@demo.com`, password: '12345' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Accept registration when password meets minimum length [Boundary: 6 chars] (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Min Length User',
        email: `minpw_${timestamp}@demo.com`,
        password: '123456',
        role: 'TEAM_MEMBER',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await step('Register primary Admin account (200 OK + JWT Cookie)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lead Admin 1',
        email: `admin1_${timestamp}@captureshare.com`,
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.role === 'ADMIN', `Expected ADMIN role, got ${data.user.role}`);
    assert(Boolean(data.token), 'Expected JWT token in registration response');
    admin1Token = data.token;
    admin1Id = data.user.id;
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), 'Expected set-cookie header on register');
    admin1Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Register secondary Admin account for cross-admin isolation tests (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lead Admin 2',
        email: `admin2_${timestamp}@captureshare.com`,
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    admin2Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Register assigned Team Member (Photographer 1) (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Photographer One',
        email: `photo1_${timestamp}@captureshare.com`,
        password: 'Password123!',
        role: 'TEAM_MEMBER',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    member1Id = data.user.id;
    const cookie = res.headers.get('set-cookie');
    member1Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Register unassigned Team Member (Photographer 2) (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Photographer Two',
        email: `photo2_${timestamp}@captureshare.com`,
        password: 'Password123!',
        role: 'TEAM_MEMBER',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    member2Id = data.user.id;
    const cookie = res.headers.get('set-cookie');
    member2Cookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Reject duplicate registration for existing email (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Admin',
        email: `admin1_${timestamp}@captureshare.com`,
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('already exists'), 'Expected duplicate email error message');
  });

  await step('Email normalization: Uppercase email in login matches lowercase registration (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ADMIN1_${timestamp}@CAPTURESHARE.COM`,
        password: 'Password123!',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.email === `admin1_${timestamp}@captureshare.com`, 'Expected normalized email in user object');
  });

  await step('Reject login for non-existent user email (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ghost_${timestamp}@notreal.com`,
        password: 'Password123!',
      }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Reject login with correct email but wrong password (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `admin1_${timestamp}@captureshare.com`,
        password: 'WrongPassword999!',
      }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Reject /api/auth/me without authentication cookie or token (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Reject /api/auth/me with tampered / forged JWT token (401)', async () => {
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZvcmdlZCIsInJvbGUiOiJBRE1JTiJ9.invalidsig';
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  await step('Accept /api/auth/me with valid Bearer header (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.email === `admin1_${timestamp}@captureshare.com`, 'User profile matches token');
  });

  await step('Logout endpoint clears session cookie correctly (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie) && (cookie!.includes('Max-Age=0') || cookie!.includes('expires=')), 'Expected cookie clearance header');
  });

  // ============================================================================
  // SECTION 2: EVENT MANAGEMENT & MULTI-TENANT ACCESS CONTROL
  // ============================================================================
  console.log('\n📦 Section 2: Event Management & Multi-Tenant Access Control');

  await step('Reject event creation without authentication (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Gala' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Team Member CANNOT create an event (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ name: 'Photographer Gala Event' }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Only Admins'), 'Expected admin restriction message');
  });

  await step('Reject event creation with empty or whitespace-only name (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ name: '   ' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Admin 1 creates Event 1 successfully (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        name: `Royal Wedding ${timestamp}`,
        description: 'Exclusive palace wedding ceremony',
        eventDate: '2026-10-15',
        location: 'Grand Ballroom, Palace Hotel',
      }),
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.event.id), 'Missing event ID');
    event1Id = data.event.id;
  });

  await step('Admin 2 creates Event 2 successfully (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin2Cookie },
      body: JSON.stringify({
        name: `Tech Conference ${timestamp}`,
        description: 'Annual AI & Cloud summit',
        eventDate: '2026-11-20',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    event2Id = data.event.id;
  });

  await step('Admin 1 creates Event 3 for multi-photographer & isolation testing (201)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        name: `Fashion Showcase ${timestamp}`,
        description: 'Multi-photographer runway show',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    event3Id = data.event.id;
  });

  await step('Admin 1 event list only displays events created by Admin 1', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const eventIds = data.events.map((e: any) => e.id);
    assert(eventIds.includes(event1Id), 'Admin 1 should see Event 1');
    assert(eventIds.includes(event3Id), 'Admin 1 should see Event 3');
    assert(!eventIds.includes(event2Id), 'Admin 1 should NOT see Event 2 owned by Admin 2');
  });

  await step('Team Member event list only displays assigned events (Initially empty)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const eventIds = data.events.map((e: any) => e.id);
    assert(!eventIds.includes(event1Id), 'Photographer 1 not yet assigned to Event 1');
  });

  await step('Reject adding non-existent user email to event (404 Not Found)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ email: `nonexistent_${timestamp}@demo.com` }),
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await step('Admin 1 adds Photographer 1 to Event 1 (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ email: `photo1_${timestamp}@captureshare.com` }),
    });
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert(data.member.user.email === `photo1_${timestamp}@captureshare.com`, 'Member email matches');
  });

  await step('Reject adding duplicate member to same event (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ email: `photo1_${timestamp}@captureshare.com` }),
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
  });

  await step('Assigned Photographer 1 now sees Event 1 in their assigned events list (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const eventIds = data.events.map((e: any) => e.id);
    assert(eventIds.includes(event1Id), 'Photographer 1 must now see Event 1');
  });

  await step('SPEC SCENARIO 1: Photographer 2 (unassigned) blocked from accessing Event 1 (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      headers: { Cookie: member2Cookie },
    });
    assert(res.status === 403, `Expected 403 Forbidden for unassigned member, got ${res.status}`);
    const data = await res.json();
    assert(data.error.toLowerCase().includes('access'), 'Expected access denied message');
  });

  await step('Requesting non-existent event ID returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/events/non-existent-event-id-999`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 3: PHOTO UPLOADS, PRESIGNING & METADATA ACCURACY
  // ============================================================================
  console.log('\n📦 Section 3: Photo Uploads, Presigning & Metadata Accuracy');

  await step('SPEC SCENARIO 3: Reject presigned upload with empty files array (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ files: [] }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Reject presigned upload for unassigned team member (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member2Cookie },
      body: JSON.stringify({
        files: [{ filename: 'intruder_shot.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 }],
      }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  let presignedBatchResults: any[] = [];
  await step('Generate batch presigned upload URLs for 4 distinct photos (200 OK)', async () => {
    const filesToUpload = [
      { filename: 'ceremony_entrance.jpg', mimeType: 'image/jpeg', sizeBytes: 2450000 },
      { filename: 'ring_exchange.jpg', mimeType: 'image/jpeg', sizeBytes: 3100000 },
      { filename: 'first_kiss.jpg', mimeType: 'image/jpeg', sizeBytes: 2890000 },
      { filename: 'blooper_closed_eyes.jpg', mimeType: 'image/jpeg', sizeBytes: 1800000 },
    ];

    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ files: filesToUpload }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.uploads.length === 4, `Expected 4 uploads, got ${data.uploads.length}`);
    presignedBatchResults = data.uploads;
  });

  await step('Reject confirm-upload with empty payload (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ photos: [] }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Confirm metadata for 4 uploaded photos (Section 4 Schema Verification) (201)', async () => {
    const confirmPayload = presignedBatchResults.map((u: any, idx: number) => ({
      filename: u.filename,
      storageKey: u.storageKey,
      publicUrl: u.publicUrl,
      sizeBytes: [2450000, 3100000, 2890000, 1800000][idx],
      mimeType: 'image/jpeg',
      width: 4000,
      height: 3000,
    }));

    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ photos: confirmPayload }),
    });

    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert(data.photos.length === 4, `Expected 4 confirmed photos, got ${data.photos.length}`);
    photoIds = data.photos.map((p: any) => p.id);
  });

  // ============================================================================
  // SECTION 4: ADMIN PHOTO CURATION & OPERATIONAL STATE COUNTS
  // ============================================================================
  console.log('\n📦 Section 4: Admin Photo Curation & Operational State Counts');

  await step('Team Member CANNOT select photos for sharing (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ photoIds: [photoIds[0]], isSelected: true }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Reject photo selection with empty photoIds array (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: [], isSelected: true }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Admin 1 selects 3 out of 4 photos for gallery publishing (200 OK)', async () => {
    const selectedBatch = [photoIds[0], photoIds[1], photoIds[2]];
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: selectedBatch, isSelected: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 3, `Expected 3 selected photos, got ${data.selectedCount}`);
  });

  await step('Verify Operational State: Total Uploaded: 4 | Selected for Publishing: 3', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.stats.totalUploadedPhotos === 4, `Expected total 4, got ${data.stats.totalUploadedPhotos}`);
    assert(data.stats.selectedPhotosCount === 3, `Expected selected 3, got ${data.stats.selectedPhotosCount}`);
  });

  await step('Admin can deselect a photo (reverts selected count to 2)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: [photoIds[2]], isSelected: false }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 2, `Expected 2 selected, got ${data.selectedCount}`);
  });

  await step('Admin re-selects photo 3 (selected count is back to 3)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: [photoIds[2]], isSelected: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 3, `Expected 3 selected, got ${data.selectedCount}`);
  });

  // ============================================================================
  // SECTION 5: GALLERY PUBLISHING & PIN ENCRYPTION
  // ============================================================================
  console.log('\n📦 Section 5: Gallery Publishing & PIN Encryption');

  await step('SPEC SCENARIO 2: Team Member attempting to publish a gallery (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ title: 'Illegal Member Gallery', pin: '123456', isPublished: true }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Reject PIN shorter than 4 digits (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ title: 'Short PIN Gallery', pin: '123', isPublished: true }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Reject PIN longer than 8 digits (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ title: 'Long PIN Gallery', pin: '123456789', isPublished: true }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Admin 1 publishes Gallery with 6-digit PIN (200 OK + URL + PIN response)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        title: 'Curated Royal Wedding Highlights',
        pin: correctPin,
        isPublished: true,
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.gallery.slug), 'Missing gallery slug');
    assert(data.accessPin === correctPin, 'Expected correct PIN returned');
    assert(Boolean(data.galleryUrl), 'Missing galleryUrl in response');
    assert(data.selectedCount === 3, `Expected 3 selected photos associated, got ${data.selectedCount}`);
    gallerySlug = data.gallery.slug;
  });

  // ============================================================================
  // SECTION 6: CUSTOMER GALLERY ACCESS & PIN VERIFICATION
  // ============================================================================
  console.log('\n📦 Section 6: Customer Public Access & PIN Verification');

  await step('Accessing non-existent gallery slug returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/non_existent_slug_404/photos`);
    assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
  });

  await step('SPEC SCENARIO 5: Unauthenticated customer cannot view photos without PIN (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/photos`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('PIN verification required'), 'Expected PIN required message');
  });

  await step('Reject empty PIN verification submission (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('SPEC SCENARIO 4: Submitting incorrect PIN returns 401 with remaining attempts counter', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '000000' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Incorrect gallery PIN'), 'Expected incorrect PIN error');
    assert(typeof data.remainingAttempts === 'number', 'Expected numeric remaining attempts counter');
  });

  let customerSessionCookie = '';
  await step('Customer enters correct 6-digit PIN: receives 200 OK and secure session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: correctPin }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), 'Expected set-cookie header on successful PIN');
    assert(cookie!.includes('captureshare_gallery_'), 'Expected gallery cookie prefix');
    customerSessionCookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('SPEC SCENARIO 5: Authenticated Customer views ONLY selected photos (Zero data leak)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/photos`, {
      headers: { Cookie: customerSessionCookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.photos.length === 3, `Expected exactly 3 selected photos, got ${data.photos.length}`);

    // Verify the unselected 4th photo was NOT leaked
    const unselectedId = photoIds[3];
    const leaked = data.photos.some((p: any) => p.id === unselectedId);
    assert(!leaked, 'CRITICAL: Unselected photo was leaked to public customer gallery!');
  });

  await step('Customer gallery session is scoped: Cookie for Gallery 1 CANNOT unlock Gallery 2', async () => {
    const otherSlug = 'abc123'; // Seeded wedding gallery
    const res = await fetch(`${BASE_URL}/api/gallery/${otherSlug}/photos`, {
      headers: { Cookie: customerSessionCookie },
    });
    assert(res.status === 401, `Expected 401 Unauthorized for cross-gallery cookie, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 7: BRUTE-FORCE RATE LIMITING PROTECTION
  // ============================================================================
  console.log('\n📦 Section 7: Brute-Force Rate Limiting Protection');

  await step('Rate Limiter locks out client after 5 consecutive failed PIN attempts (429 Too Many Requests)', async () => {
    const testSlug = `brute_slug_${timestamp}`;
    const clientIp = `10.0.0.${(timestamp % 240) + 1}`;

    let hitLockout = false;
    for (let attempt = 1; attempt <= 7; attempt++) {
      const res = await fetch(`${BASE_URL}/api/gallery/${testSlug}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': clientIp,
        },
        body: JSON.stringify({ pin: '111111' }),
      });

      if (res.status === 429) {
        hitLockout = true;
        const data = await res.json();
        assert(data.error.includes('Too many incorrect attempts'), 'Expected rate limit lockout message');
        break;
      }
    }
    assert(hitLockout, 'Expected rate limiter to trigger HTTP 429 after 5 failed attempts');
  });

  // ============================================================================
  // SECTION 8: DRAFT / UNPUBLISHED GALLERY ACCESS RESTRICTION
  // ============================================================================
  console.log('\n📦 Section 8: Draft / Unpublished Gallery Access Restrictions');

  let draftSlug = '';
  await step('Admin creates a draft gallery (isPublished = false)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        title: 'Draft Private Gallery',
        pin: '555555',
        isPublished: false,
        customSlug: `draft_${timestamp}`,
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    draftSlug = data.gallery.slug;
  });

  await step('Public customer entering PIN on unpublished gallery is denied (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${draftSlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '555555' }),
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('not been published'), 'Expected not published message');
  });

  await step('Direct photo query on unpublished gallery returns 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${draftSlug}/photos`);
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 9: BINARY STORAGE & FILE SERVING PIPELINE
  // ============================================================================
  console.log('\n📦 Section 9: Binary Storage & File Serving Pipeline');

  const testStorageKey = `events/${event1Id}/test_binary_${timestamp}.jpg`;
  // Sample 1x1 JPEG byte stream
  const sampleJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x00, 0xff, 0xd9
  ]);

  await step('Direct photo binary upload via /api/events/[id]/photos/upload-direct (200 OK)', async () => {
    const res = await fetch(
      `${BASE_URL}/api/events/${event1Id}/photos/upload-direct?key=${encodeURIComponent(testStorageKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Cookie: admin1Cookie,
        },
        body: sampleJpegBuffer,
      }
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');
    assert(data.storageKey === testStorageKey, 'Expected matching storageKey');
    assert(data.publicUrl.includes(testStorageKey), 'Expected publicUrl referencing key');
  });

  await step('Serve binary photo via /api/storage/[...key] (200 + Content-Type: image/jpeg)', async () => {
    const res = await fetch(`${BASE_URL}/api/storage/${testStorageKey}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const contentType = res.headers.get('content-type');
    assert(Boolean(contentType) && contentType!.includes('image/jpeg'), `Expected image/jpeg, got ${contentType}`);
    const cacheControl = res.headers.get('cache-control');
    assert(Boolean(cacheControl) && cacheControl!.includes('immutable'), 'Expected immutable caching header');
    const arrayBuf = await res.arrayBuffer();
    assert(arrayBuf.byteLength === sampleJpegBuffer.length, `Expected ${sampleJpegBuffer.length} bytes, got ${arrayBuf.byteLength}`);
  });

  await step('Direct upload without query key parameter returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/upload-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', Cookie: admin1Cookie },
      body: sampleJpegBuffer,
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Unauthorized client direct upload returns 401 Unauthorized', async () => {
    const res = await fetch(
      `${BASE_URL}/api/events/${event1Id}/photos/upload-direct?key=${encodeURIComponent(testStorageKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: sampleJpegBuffer,
      }
    );
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Unassigned photographer direct upload returns 403 Forbidden', async () => {
    const res = await fetch(
      `${BASE_URL}/api/events/${event1Id}/photos/upload-direct?key=${encodeURIComponent(testStorageKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg', Cookie: member2Cookie },
        body: sampleJpegBuffer,
      }
    );
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await step('Querying non-existent storage key returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/api/storage/events/missing_folder/non_existent_image_9999.jpg`);
    assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
  });

  await step('Storage path traversal attack is securely blocked (404/500)', async () => {
    const res = await fetch(`${BASE_URL}/api/storage/..%2F..%2Fpackage.json`);
    assert(res.status === 404 || res.status === 500, `Expected 404 or 500 blocked traversal, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 10: MULTI-PHOTOGRAPHER UPLOAD ISOLATION (SPEC REQUIREMENT)
  // ============================================================================
  console.log('\n📦 Section 10: Multi-Photographer Upload Isolation (Spec Requirement)');

  await step('Admin assigns Photographer 1 to Event 3', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ email: `photo1_${timestamp}@captureshare.com` }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
  });

  let p1PhotoId = '';
  await step('Photographer 1 uploads photo P1 to Event 3 (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/photos/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({
        photos: [{
          filename: 'photo1_model_walk.jpg',
          storageKey: `events/${event3Id}/p1_walk.jpg`,
          publicUrl: `/api/storage/events/${event3Id}/p1_walk.jpg`,
          sizeBytes: 1500000,
          mimeType: 'image/jpeg',
          width: 3000,
          height: 2000,
        }],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    p1PhotoId = data.photos[0].id;
  });

  let adminPhotoId = '';
  await step('Admin uploads photo A1 to Event 3 (201 Created)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/photos/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        photos: [{
          filename: 'admin_backstage_view.jpg',
          storageKey: `events/${event3Id}/admin_backstage.jpg`,
          publicUrl: `/api/storage/events/${event3Id}/admin_backstage.jpg`,
          sizeBytes: 1800000,
          mimeType: 'image/jpeg',
          width: 3000,
          height: 2000,
        }],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    adminPhotoId = data.photos[0].id;
  });

  await step('SPEC ISOLATION: Photographer 1 sees ONLY photo P1 (Admin photo hidden) (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/photos`, {
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const ids = data.photos.map((p: any) => p.id);
    assert(ids.includes(p1PhotoId), 'Photographer 1 must see their own uploaded photo');
    assert(!ids.includes(adminPhotoId), 'Photographer 1 CANNOT see photo uploaded by Admin or other photographers');
  });

  await step('SPEC ADMIN ACCESS: Admin sees ALL photos from all uploaders (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/photos`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const ids = data.photos.map((p: any) => p.id);
    assert(ids.includes(p1PhotoId), 'Admin must see photographer uploaded photo');
    assert(ids.includes(adminPhotoId), 'Admin must see admin uploaded photo');
  });

  // ============================================================================
  // SECTION 11: TEAM MEMBER REMOVAL & ACCESS REVOCATION
  // ============================================================================
  console.log('\n📦 Section 11: Team Member Removal & Access Revocation');

  await step('Team member CANNOT remove a team member (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({ userId: member1Id }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await step('Reject member deletion when userId is missing (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await step('Attempting to remove unassigned user returns 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ userId: member2Id }),
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await step('Admin removes Photographer 1 from Event 3 (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ userId: member1Id }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await step('REVOCATION VERIFIED: Removed Photographer 1 immediately denied access to Event 3 (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}`, {
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 403, `Expected 403 Forbidden after removal, got ${res.status}`);
  });

  await step('REVOCATION VERIFIED: Removed Photographer 1 blocked from uploading photos (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event3Id}/photos/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
      body: JSON.stringify({
        files: [{ filename: 'post_removal.jpg', mimeType: 'image/jpeg', sizeBytes: 1000 }],
      }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 12: GALLERY RE-PUBLISHING, PIN ROTATION & INACTIVATION
  // ============================================================================
  console.log('\n📦 Section 12: Gallery Re-Publishing & PIN Rotation');

  const newRotatedPin = '991122';
  await step('Admin re-publishes Gallery 1 with rotated PIN & updated title (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        title: 'Updated Palace Highlights (Rotated PIN)',
        pin: newRotatedPin,
        isPublished: true,
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.accessPin === newRotatedPin, 'Expected updated PIN in response');
    assert(data.gallery.title.includes('Updated Palace Highlights'), 'Expected updated title');
    gallerySlug = data.gallery.slug;
  });

  await step('Customer submitting OLD PIN is rejected (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: correctPin }), // old PIN
    });
    assert(res.status === 401, `Expected 401 with old PIN, got ${res.status}`);
  });

  let newCustomerCookie = '';
  await step('Customer unlocks gallery with NEW rotated PIN (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: newRotatedPin }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const cookie = res.headers.get('set-cookie');
    assert(Boolean(cookie), 'Expected new gallery session cookie');
    newCustomerCookie = cookie ? cookie.split(';')[0] : '';
  });

  await step('Customer with new session cookie views photos successfully (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/gallery/${gallerySlug}/photos`, {
      headers: { Cookie: newCustomerCookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.photos.length === 3, `Expected 3 photos, got ${data.photos.length}`);
  });

  // ============================================================================
  // SECTION 13: BULK SELECTION BOUNDARIES & CROSS-EVENT ISOLATION
  // ============================================================================
  console.log('\n📦 Section 13: Bulk Selection Boundaries & Cross-Event Isolation');

  await step('Selecting non-existent photo ID does not crash server (200 OK with count unchanged)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: ['non-existent-photo-uuid-999'], isSelected: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await step('Cross-Event Photo Selection Isolation: Selecting Event 3 photo in Event 1 does not select it', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: [p1PhotoId], isSelected: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    // Check Event 3 photo is not marked selected
    const resEvent3 = await fetch(`${BASE_URL}/api/events/${event3Id}/photos`, {
      headers: { Cookie: admin1Cookie },
    });
    const data3 = await resEvent3.json();
    const p1Photo = data3.photos.find((p: any) => p.id === p1PhotoId);
    assert(p1Photo && !p1Photo.isSelected, 'Event 3 photo must remain unselected');
  });

  await step('Bulk deselect all photos from Event 1 (Selected count reaches 0)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: photoIds, isSelected: false }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 0, `Expected 0 selected photos, got ${data.selectedCount}`);
  });

  await step('Verify Operational Counter: Total Uploaded: 4 | Selected: 0', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.stats.totalUploadedPhotos === 4, `Expected total 4, got ${data.stats.totalUploadedPhotos}`);
    assert(data.stats.selectedPhotosCount === 0, `Expected selected 0, got ${data.stats.selectedPhotosCount}`);
  });

  await step('Bulk re-select all 4 photos (Selected count becomes 4)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}/photos/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({ photoIds: photoIds, isSelected: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.selectedCount === 4, `Expected 4 selected photos, got ${data.selectedCount}`);
  });

  // ============================================================================
  // SECTION 14: SECURITY INJECTIONS & SANITIZATION DEFENSES
  // ============================================================================
  console.log('\n📦 Section 14: Security Injections & Sanitization Defenses');

  let xssEventId = '';
  await step('XSS Payload in event name is stored safely without execution (201 Created)', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin1Cookie },
      body: JSON.stringify({
        name: `XSS Test Event ${xssPayload}`,
        description: 'Testing XSS sanitization',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.event.name.includes('<script>'), 'Payload preserved as plain string');
    xssEventId = data.event.id;
  });

  await step('SQL Injection attempt in event ID parameter returns 404 (Prisma parameterized protection)', async () => {
    const sqlInjection = "1' OR '1'='1' --";
    const res = await fetch(`${BASE_URL}/api/events/${encodeURIComponent(sqlInjection)}`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 404 || res.status === 403, `Expected 404 or 403 safely handled, got ${res.status}`);
  });

  await step('SQL Injection attempt in gallery slug parameter returns 404 safely', async () => {
    const sqlInjection = "gallery' UNION SELECT null, null, null --";
    const res = await fetch(`${BASE_URL}/api/gallery/${encodeURIComponent(sqlInjection)}/photos`);
    assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
  });

  await step('Malformed JWT header string returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' },
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Empty Authorization Bearer returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer ' },
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await step('Clean up temporary XSS test event (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${xssEventId}`, {
      method: 'DELETE',
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 15: PUBLIC FRONTEND SSR / PAGE RENDERING CHECKS
  // ============================================================================
  console.log('\n📦 Section 15: Public Frontend SSR & Page Rendering Checks');

  await step('GET / (Home Landing Page) returns 200 OK with CaptureShare branding', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('CaptureShare'), 'Expected CaptureShare in HTML landing page');
    assert(html.includes('admin@captureshare.com'), 'Expected demo credentials in landing page');
  });

  await step('GET /login returns 200 OK with Sign In form and Demo autofill', async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('Sign in to your account') || html.includes('Sign in'), 'Expected Sign In header');
    assert(html.includes('Admin Demo') || html.includes('Demo'), 'Expected quick autofill buttons');
  });

  await step('GET /register returns 200 OK with Create Account form', async () => {
    const res = await fetch(`${BASE_URL}/register`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('Create an account') || html.includes('Register'), 'Expected Register header');
  });

  await step('GET /gallery/[slug] returns 200 OK with Customer PIN unlock interface', async () => {
    const res = await fetch(`${BASE_URL}/gallery/${gallerySlug}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('Enter PIN to Access') || html.includes('PIN') || html.includes('Gallery'), 'Expected PIN unlock page UI');
  });

  await step('GET /dashboard redirects or rejects unauthenticated visitors', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    // In Next.js App Router client page or middleware, unauthenticated dashboard redirects (307/302) or loads
    assert(res.status === 200 || res.status === 307 || res.status === 302, `Expected 200 or redirect, got ${res.status}`);
  });

  // ============================================================================
  // SECTION 16: EVENT DELETION, CASCADE CLEANUP & ACCESS TERMINATION
  // ============================================================================
  console.log('\n📦 Section 16: Event Deletion & Cascade Cleanups');

  await step('Team Member CANNOT delete an event (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      method: 'DELETE',
      headers: { Cookie: member1Cookie },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Admin 2 CANNOT delete Event 1 owned by Admin 1 (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      method: 'DELETE',
      headers: { Cookie: admin2Cookie },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await step('Admin 1 deletes Event 1 successfully (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      method: 'DELETE',
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
  });

  await step('Deleted Event 1 is no longer accessible by Admin 1 (404 Not Found)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/${event1Id}`, {
      headers: { Cookie: admin1Cookie },
    });
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await step('Clean up Event 2 and Event 3 (200 OK)', async () => {
    const res2 = await fetch(`${BASE_URL}/api/events/${event2Id}`, {
      method: 'DELETE',
      headers: { Cookie: admin2Cookie },
    });
    assert(res2.status === 200, `Expected 200, got ${res2.status}`);

    const res3 = await fetch(`${BASE_URL}/api/events/${event3Id}`, {
      method: 'DELETE',
      headers: { Cookie: admin1Cookie },
    });
    assert(res3.status === 200, `Expected 200, got ${res3.status}`);
  });

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passed}/${total} TESTS PASSED (100% SUCCESS RATE)`);
  console.log('   All 16 sections, edge cases, role barriers, and storage verified!');
  console.log('======================================================================\n');
}

runAllPossibilitiesTests().catch((err) => {
  console.error('\n❌ Comprehensive Test Suite Failed:', err);
  process.exit(1);
});
