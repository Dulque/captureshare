# TrizenShare — Collaborative Photo Sharing & Customer Gallery Platform

A production-ready full-stack photo-sharing application designed for event photography teams. Photographers collaboratively upload event photographs directly to object storage, Admins curate and select photos, and publish customer-facing galleries protected by a 6-digit access PIN without requiring customer registration.

Built for the **TrizenAI Full-Stack Internship Challenge**.

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Clients
        Admin[Admin / Lead]
        Photographer[Team Member / Photographer]
        Customer[Customer / Public Client]
    end

    subgraph "Application Layer (Next.js 14 App Router)"
        Web[Next.js SSR & React 18 UI + Tailwind CSS]
        Auth[JWT Authentication & RBAC Middleware]
        APIRoutes[Next.js Server API Routes]
        RateLimiter[PIN Rate Limiter & Brute-Force Shield]
    end

    subgraph "Data & Storage Layer"
        DB[(PostgreSQL / SQLite via Prisma ORM)]
        S3[(Object Storage: AWS S3 / Cloudflare R2 / Supabase)]
    end

    Admin -->|Login / Create Events / Curate / Publish Gallery| Web
    Photographer -->|Login / View Assigned Events| Web
    Photographer -->|1. Request Presigned Upload Target| APIRoutes
    APIRoutes -->|2. Generate S3 Presigned PUT URL| Photographer
    Photographer -->|3. Direct Parallel Upload| S3
    Photographer -->|4. Confirm Photo Metadata| APIRoutes
    APIRoutes -->|Save Metadata| DB

    Customer -->|Access /gallery/[slug] + Enter PIN| RateLimiter
    RateLimiter -->|Verify PIN Hash| DB
    Customer -->|Stream Published Photos| S3
```

### Direct-to-Cloud Upload Flow
1. Team members select photos in the browser.
2. The browser requests S3 Presigned URLs from `/api/events/[id]/photos/presign-upload`.
3. Files stream **directly** from the client browser to Cloud Object Storage (S3 / Cloudflare R2), preventing Node.js server bottlenecks and memory spikes.
4. Photo metadata (`photoId`, `eventId`, `uploadedById`, `filename`, `storageLocation`, `fileSize`, `createdAt`) is recorded in the database via `/api/events/[id]/photos/confirm-upload`.
5. *Offline Dev Fallback*: Includes an automatic local storage adapter if S3 credentials are not configured.

---

## 2. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM
- **Object Storage**: AWS S3 / Cloudflare R2 / Supabase Storage via `@aws-sdk/client-s3` (with local disk fallback)
- **Authentication**: JWT, HTTP-Only Secure Cookies, `bcryptjs`
- **Security**: Rate limiting against PIN brute-forcing (5 attempts/10 min window)
- **Testing**: Automated Integration Suite via `npm test` (`tsx` test runner)

---

## 3. Database Schema Design

The relational model strictly reflects multi-photographer collaboration and selective customer publishing:

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String
  role         String        @default("TEAM_MEMBER") // "ADMIN" | "TEAM_MEMBER"
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  createdEvents Event[]      @relation("AdminEvents")
  eventMembers  EventMember[]
  uploadedPhotos Photo[]
}

model Event {
  id          String        @id @default(cuid())
  name        String
  description String?
  eventDate   DateTime?
  status      String        @default("ACTIVE")
  adminId     String
  admin       User          @relation("AdminEvents", fields: [adminId], references: [id], onDelete: Cascade)
  members     EventMember[]
  photos      Photo[]
  galleries   Gallery[]
}

model EventMember {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([eventId, userId])
}

model Photo {
  id           String         @id @default(cuid())
  eventId      String
  event        Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User           @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  filename     String
  storageKey   String
  storageUrl   String
  fileSize     Int
  mimeType     String
  isSelected   Boolean        @default(false)
  createdAt    DateTime       @default(now())
  galleryPhotos GalleryPhoto[]
}

model Gallery {
  id          String         @id @default(cuid())
  eventId     String
  event       Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title       String
  slug        String         @unique // e.g. "abc123"
  pinHash     String         // Bcrypt hashed PIN
  isPublished Boolean        @default(false)
  photos      GalleryPhoto[]
}

model GalleryPhoto {
  id        String   @id @default(cuid())
  galleryId String
  photoId   String
  gallery   Gallery  @relation(fields: [galleryId], references: [id], onDelete: Cascade)
  photo     Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([galleryId, photoId])
}
```

---

## 4. Pre-Configured Demo Credentials

For testing and evaluation, pre-seeded accounts and operational state matching the specification document:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin / Lead** | `admin@trizen.com` | `Password123!` | Create events, invite team, curate/select photos, publish galleries |
| **Team Member** | `photographer@trizen.com` | `Password123!` | View assigned events, upload photos, view own uploads |

### Example Operational State (From Requirements Doc)
- **Event Name**: `Arjun & Priya Wedding`
- **Total Uploaded Photos**: 8 (with high-res sample ceremony & reception photography)
- **Selected for Publishing**: 6
- **Customer Gallery URL**: `http://localhost:3000/gallery/abc123`
- **Customer Access PIN**: `482917`

---

## 5. Local Setup Instructions

### 1. Clone & Install
```bash
git clone <repository-url>
cd "TrizenAI project"
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` for zero-configuration local execution:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="trizen_super_secret_jwt_key_development_2026"
```

### 3. Initialize Database & Seed Demo Data
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Automated Testing

Run the automated test suite covering:
- Authentication & Password hashing (bcrypt)
- Role-Based Access Control (Admin vs Team Member)
- Multi-Tenant Event Isolation (Unassigned members cannot access events)
- PIN verification & Brute-force rate limiting
- Draft gallery & unpublished photo protection

```bash
npm test
```
```text
========================================
🧪 TrizenShare Automated Test Suite
========================================
📦 Suite 1: Authentication & Token Security
  ✓ should hash and verify passwords using bcrypt
  ✓ should hash and verify PINs with bcrypt
  ✓ should sign and verify valid user session tokens
  ✓ should sign and verify customer gallery tokens
  ✓ should reject invalid or tampered tokens

📦 Suite 2: Event Access Control & Role-Based Isolation
  ✓ Admin has full access to event
  ✓ Assigned team member can access their assigned event
  ✓ Unassigned team member is blocked from accessing event (Tenant Isolation)

📦 Suite 3: Gallery Publishing & PIN Protection
  ✓ Customer with correct PIN unlocks published gallery
  ✓ Customer with incorrect PIN is denied access
  ✓ Brute-force protection: Locks out attempts after 5 consecutive failures
  ✓ Draft gallery cannot be accessed by public

========================================
📊 Test Results: 12/12 passed (100%)
🎉 All tests passed successfully!
========================================
```

---

## 7. Cloud Deployment (Vercel + Neon / Supabase + Cloudflare R2 / S3)

1. **Database**: Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
   - In `prisma/schema.prisma`, set `provider = "postgresql"`.
   - Set `DATABASE_URL="postgresql://user:password@host/db?sslmode=require"` in Vercel Environment Variables.
2. **Object Storage**: Create an S3 Bucket (AWS S3) or Cloudflare R2 Bucket.
   - Configure CORS on the bucket:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["PUT", "GET", "HEAD"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": ["ETag"]
       }
     ]
     ```
   - Add credentials to Vercel Environment Variables:
     ```env
     STORAGE_PROVIDER="s3"
     S3_REGION="auto"
     S3_BUCKET="your-bucket-name"
     S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
     S3_ACCESS_KEY_ID="<your-key>"
     S3_SECRET_ACCESS_KEY="<your-secret>"
     ```
3. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

---

## 8. Security Scenarios Handled

| Scenario | Handled By |
| :--- | :--- |
| **A user attempting to access another event** | Service guard `checkEventAccess` verifies user is in `EventMember` (or is Event Admin), returning `403 Forbidden`. |
| **A Team Member attempting to publish a gallery** | `/api/events/[id]/gallery` explicitly checks `user.role === 'ADMIN'`. Non-admins receive `403 Forbidden`. |
| **A failed photo upload** | Multi-photo upload modal tracks per-file status with retry indicators and error messages; DB transaction only commits confirmed uploads. |
| **An incorrect gallery PIN** | Returns `401 Unauthorized` with remaining attempts counter. Protected by IP-based rate limiting (locks out after 5 consecutive failures for 10 minutes). |
| **Attempted access to unpublished photos** | `/api/gallery/[slug]/photos` filters strictly for `gallery.isPublished = true` and `photo.isSelected = true`. Unselected photos are never queried or returned. |
