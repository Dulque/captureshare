import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { checkEventAccess, hashPassword } from '@/lib/auth';

describe('Role-Based Authorization & Event Isolation', () => {
  let adminUser: any;
  let assignedMember: any;
  let unassignedMember: any;
  let testEvent: any;

  beforeAll(async () => {
    const pw = await hashPassword('Pass123!');

    adminUser = await prisma.user.create({
      data: {
        email: `admin_${Date.now()}@test.com`,
        name: 'Test Admin',
        passwordHash: pw,
        role: 'ADMIN',
      },
    });

    assignedMember = await prisma.user.create({
      data: {
        email: `member_assigned_${Date.now()}@test.com`,
        name: 'Assigned Member',
        passwordHash: pw,
        role: 'TEAM_MEMBER',
      },
    });

    unassignedMember = await prisma.user.create({
      data: {
        email: `member_unassigned_${Date.now()}@test.com`,
        name: 'Unassigned Member',
        passwordHash: pw,
        role: 'TEAM_MEMBER',
      },
    });

    testEvent = await prisma.event.create({
      data: {
        name: 'Corporate Gala 2026',
        adminId: adminUser.id,
      },
    });

    // Assign only assignedMember
    await prisma.eventMember.create({
      data: {
        eventId: testEvent.id,
        userId: assignedMember.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.eventMember.deleteMany({ where: { eventId: testEvent.id } });
    await prisma.event.delete({ where: { id: testEvent.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, assignedMember.id, unassignedMember.id] },
      },
    });
    await prisma.$disconnect();
  });

  it('allows Admin to access the event', async () => {
    const hasAccess = await checkEventAccess(testEvent.id, {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'ADMIN',
    });
    expect(hasAccess).toBe(true);
  });

  it('allows assigned Team Member to access the event', async () => {
    const hasAccess = await checkEventAccess(testEvent.id, {
      id: assignedMember.id,
      email: assignedMember.email,
      name: assignedMember.name,
      role: 'TEAM_MEMBER',
    });
    expect(hasAccess).toBe(true);
  });

  it('strictly blocks unassigned Team Member from accessing the event (Multi-tenant isolation)', async () => {
    const hasAccess = await checkEventAccess(testEvent.id, {
      id: unassignedMember.id,
      email: unassignedMember.email,
      name: unassignedMember.name,
      role: 'TEAM_MEMBER',
    });
    expect(hasAccess).toBe(false);
  });
});
