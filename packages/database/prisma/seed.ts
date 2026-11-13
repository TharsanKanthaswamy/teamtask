import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await argon2.hash('Admin@123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const userHash = await argon2.hash('Password@123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.platformAdmin.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Super Admin user
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'admin@teamtrack.local',
      passwordHash: adminHash,
      status: 'ACTIVE',
    },
  });

  await prisma.platformAdmin.create({
    data: {
      userId: superAdmin.id,
      adminLevel: 'SUPER_ADMIN',
      enabled: true,
    },
  });

  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create development users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alice Chen',
        email: 'alice@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carol Martinez',
        email: 'carol@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'David Kim',
        email: 'david@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Emma Rodriguez',
        email: 'emma@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Frank Anderson',
        email: 'frank@teamtrack.local',
        passwordHash: userHash,
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log('✅ Created development users');

  // Create Team Alpha
  const teamAlpha = await prisma.team.create({
    data: {
      name: 'Team Alpha',
      slug: 'team-alpha',
      description: 'Frontend Development Team',
      status: 'ACTIVE',
    },
  });

  // Add members to Team Alpha
  await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[0].id, // Alice - Team Lead
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[1].id, // Bob - Team Member
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[2].id, // Carol - Team Member
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Team Alpha with 3 members');

  // Create Team Beta
  const teamBeta = await prisma.team.create({
    data: {
      name: 'Team Beta',
      slug: 'team-beta',
      description: 'Backend Infrastructure Team',
      status: 'ACTIVE',
    },
  });

  // Add members to Team Beta
  await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[3].id, // David - Team Lead
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[4].id, // Emma - Team Member
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[5].id, // Frank - Team Member
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Team Beta with 3 members');

  // Create audit log entries
  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: 'CREATE_TEAM',
      entityType: 'Team',
      entityId: teamAlpha.id,
      metadata: { teamName: teamAlpha.name },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: 'CREATE_TEAM',
      entityType: 'Team',
      entityId: teamBeta.id,
      metadata: { teamName: teamBeta.name },
    },
  });

  console.log('✅ Created audit logs');
  console.log('\n📊 Seed Summary:');
  console.log('  - 1 Super Admin (admin@teamtrack.local / Admin@123)');
  console.log('  - 6 Regular Users (password: Password@123)');
  console.log('  - 2 Teams (Alpha: 3 members, Beta: 3 members)');
  console.log('\n🎉 Database seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
