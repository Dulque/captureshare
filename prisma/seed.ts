import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TrizenShare database seed...');

  // 1. Clean existing records
  await prisma.galleryPhoto.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin & Team Member
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@trizen.com',
      name: 'Rohan Sharma (Admin)',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const teamMember = await prisma.user.create({
    data: {
      email: 'photographer@trizen.com',
      name: 'Simran Kaur (Photographer)',
      passwordHash,
      role: 'TEAM_MEMBER',
    },
  });

  console.log('✅ Created Demo Users:');
  console.log(`   Admin: ${admin.email} / Password123!`);
  console.log(`   Team Member: ${teamMember.email} / Password123!`);

  // 3. Create Example Operational State Event: "Arjun & Priya Wedding"
  const weddingEvent = await prisma.event.create({
    data: {
      name: 'Arjun & Priya Wedding',
      description: 'Destination wedding ceremony and grand evening reception in Udaipur.',
      eventDate: new Date('2026-09-15T18:00:00Z'),
      adminId: admin.id,
    },
  });

  // Assign Team Member to this event
  await prisma.eventMember.create({
    data: {
      eventId: weddingEvent.id,
      userId: teamMember.id,
    },
  });

  console.log('✅ Created Event: "Arjun & Priya Wedding" and assigned Team Member');

  // 4. Create sample high-resolution photos
  const samplePhotoUrls = [
    {
      filename: 'wedding_mandap_ceremony.jpg',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
      size: 4200000,
      isSelected: true,
    },
    {
      filename: 'bride_and_groom_portrait.jpg',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      size: 5100000,
      isSelected: true,
    },
    {
      filename: 'wedding_rings_vows.jpg',
      url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1600&q=80',
      size: 3800000,
      isSelected: true,
    },
    {
      filename: 'evening_reception_lights.jpg',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=80',
      size: 4900000,
      isSelected: true,
    },
    {
      filename: 'couple_first_dance.jpg',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
      size: 4600000,
      isSelected: true,
    },
    {
      filename: 'candid_family_laughter.jpg',
      url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80',
      size: 3400000,
      isSelected: true,
    },
    {
      filename: 'raw_test_lighting_shot_1.jpg',
      url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
      size: 2900000,
      isSelected: false, // Not selected for publishing (unselected draft)
    },
    {
      filename: 'raw_behind_scenes_prep.jpg',
      url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=80',
      size: 3100000,
      isSelected: false, // Not selected for publishing
    },
  ];

  const createdPhotos = [];
  for (const item of samplePhotoUrls) {
    const photo = await prisma.photo.create({
      data: {
        eventId: weddingEvent.id,
        uploadedById: teamMember.id,
        filename: item.filename,
        storageKey: `events/${weddingEvent.id}/${item.filename}`,
        storageUrl: item.url,
        fileSize: item.size,
        mimeType: 'image/jpeg',
        isSelected: item.isSelected,
      },
    });
    createdPhotos.push(photo);
  }

  console.log(`✅ Uploaded ${createdPhotos.length} sample event photos (6 selected, 2 unselected)`);

  // 5. Create Published Gallery with exact credentials from PDF:
  // Slug: "abc123"
  // PIN: "482917"
  const pinHash = await bcrypt.hash('482917', 10);

  const gallery = await prisma.gallery.create({
    data: {
      eventId: weddingEvent.id,
      title: 'Arjun & Priya Wedding — Curated Highlights',
      slug: 'abc123',
      pinHash,
      isPublished: true,
    },
  });

  // Link selected photos to gallery
  const selectedPhotos = createdPhotos.filter((p) => p.isSelected);
  for (const sp of selectedPhotos) {
    await prisma.galleryPhoto.create({
      data: {
        galleryId: gallery.id,
        photoId: sp.id,
      },
    });
  }

  console.log('✅ Published Customer Gallery:');
  console.log(`   Gallery URL: http://localhost:3000/gallery/${gallery.slug}`);
  console.log(`   Access PIN: 482917`);
  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
