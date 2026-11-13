import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich database data into Supabase...');

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

  // Clear existing data cleanly in reverse dependency order
  console.log('🧹 Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.taskReview.deleteMany();
  await prisma.contributionLog.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.platformAdmin.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Existing data cleared');

  // 1. Create Super Admin user
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'tharsank2@gmail.com',
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

  // 2. Create Regular Users
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

  console.log('✅ Created 6 Team Members');

  // 3. Create Teams
  const teamAlpha = await prisma.team.create({
    data: {
      name: 'Team Alpha',
      slug: 'team-alpha',
      description: 'Frontend & Product Experience Team',
      status: 'ACTIVE',
    },
  });

  const teamBeta = await prisma.team.create({
    data: {
      name: 'Team Beta',
      slug: 'team-beta',
      description: 'Cloud Infrastructure & Core Services Team',
      status: 'ACTIVE',
    },
  });

  // 4. Add Members to Team Alpha
  const tmAlice = await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[0].id, // Alice
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
    },
  });

  const tmBob = await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[1].id, // Bob
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  const tmCarol = await prisma.teamMember.create({
    data: {
      teamId: teamAlpha.id,
      userId: users[2].id, // Carol
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  // 5. Add Members to Team Beta
  const tmDavid = await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[3].id, // David
      role: 'TEAM_LEAD',
      status: 'ACTIVE',
    },
  });

  const tmEmma = await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[4].id, // Emma
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  const tmFrank = await prisma.teamMember.create({
    data: {
      teamId: teamBeta.id,
      userId: users[5].id, // Frank
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Teams & Memberships');

  // 6. Create Projects for Team Alpha
  const projectAlpha1 = await prisma.project.create({
    data: {
      teamId: teamAlpha.id,
      name: 'E-Commerce Mobile App',
      slug: 'ecommerce-mobile-app',
      description: 'Cross-platform mobile shopping experience with real-time checkout and biometric payment.',
      objectives: 'Deliver iOS and Android apps with < 1.5s cold start and 99.9% checkout reliability.',
      projectLeadId: tmAlice.id,
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2026-10-01'),
      targetEndDate: new Date('2026-12-31'),
      createdBy: tmAlice.id,
    },
  });

  const projectAlpha2 = await prisma.project.create({
    data: {
      teamId: teamAlpha.id,
      name: 'Design System 2.0',
      slug: 'design-system-2',
      description: 'Unified accessible component library with liquid glass styling and automatic dark mode.',
      objectives: 'Standardize 40+ atomic components across all internal and public web surfaces.',
      projectLeadId: tmAlice.id,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: new Date('2026-11-01'),
      targetEndDate: new Date('2027-01-31'),
      createdBy: tmAlice.id,
    },
  });

  // Add Project Members for Team Alpha
  await prisma.projectMember.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      teamMemberId: tmAlice.id,
      responsibility: 'Lead Architect & Product Owner',
    },
  });
  await prisma.projectMember.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      teamMemberId: tmBob.id,
      responsibility: 'Lead React Native / Frontend Engineer',
    },
  });
  await prisma.projectMember.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      teamMemberId: tmCarol.id,
      responsibility: 'UI/UX Designer & Checkout Integration',
    },
  });

  await prisma.projectMember.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha2.id,
      teamMemberId: tmAlice.id,
      responsibility: 'Design System Lead',
    },
  });
  await prisma.projectMember.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha2.id,
      teamMemberId: tmBob.id,
      responsibility: 'Component Developer',
    },
  });

  // 7. Create Projects for Team Beta
  const projectBeta1 = await prisma.project.create({
    data: {
      teamId: teamBeta.id,
      name: 'Cloud Infrastructure Migration',
      slug: 'cloud-infra-migration',
      description: 'Migrate on-prem microservices to high-availability Kubernetes clusters on AWS.',
      objectives: 'Zero-downtime database failover, auto-scaling up to 50,000 req/sec, and cost optimization.',
      projectLeadId: tmDavid.id,
      status: 'ACTIVE',
      priority: 'CRITICAL',
      startDate: new Date('2026-09-15'),
      targetEndDate: new Date('2026-12-15'),
      createdBy: tmDavid.id,
    },
  });

  const projectBeta2 = await prisma.project.create({
    data: {
      teamId: teamBeta.id,
      name: 'API Gateway Modernization',
      slug: 'api-gateway-modernization',
      description: 'Centralized edge routing, rate limiting, and distributed tracing with OpenTelemetry.',
      objectives: 'Consolidate 12 backend services under a single unified GraphQL and REST gateway.',
      projectLeadId: tmDavid.id,
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2026-12-01'),
      targetEndDate: new Date('2027-02-28'),
      createdBy: tmDavid.id,
    },
  });

  // Add Project Members for Team Beta
  await prisma.projectMember.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      teamMemberId: tmDavid.id,
      responsibility: 'Infrastructure Architect & Security Lead',
    },
  });
  await prisma.projectMember.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      teamMemberId: tmEmma.id,
      responsibility: 'DevOps & Kubernetes Engineer',
    },
  });
  await prisma.projectMember.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      teamMemberId: tmFrank.id,
      responsibility: 'CI/CD & Observability Engineer',
    },
  });

  console.log('✅ Created Projects & Project Memberships');

  // 8. Create Milestones
  const msAlpha1 = await prisma.milestone.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      title: 'Milestone 1: UI Wireframes & Auth',
      description: 'User onboarding, biometric login, and design tokens setup.',
      status: 'COMPLETED',
      sequence: 1,
      weight: 30,
      dueDate: new Date('2026-10-31'),
    },
  });

  const msAlpha2 = await prisma.milestone.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      title: 'Milestone 2: Catalog & Checkout',
      description: 'Product list, filtering, cart management, and Stripe integration.',
      status: 'IN_PROGRESS',
      sequence: 2,
      weight: 70,
      dueDate: new Date('2026-12-15'),
    },
  });

  const msBeta1 = await prisma.milestone.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      title: 'Milestone 1: Multi-Region VPC & Terraform',
      description: 'Provision AWS infrastructure as code with automated VPC peering.',
      status: 'COMPLETED',
      sequence: 1,
      weight: 40,
      dueDate: new Date('2026-10-20'),
    },
  });

  const msBeta2 = await prisma.milestone.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      title: 'Milestone 2: Kubernetes Cluster & Auto-scaling',
      description: 'Deploy EKS cluster, ingress controllers, and Horizontal Pod Autoscalers.',
      status: 'IN_PROGRESS',
      sequence: 2,
      weight: 60,
      dueDate: new Date('2026-11-30'),
    },
  });

  console.log('✅ Created Milestones');

  // 9. Create Tasks & Assignees for Team Alpha
  const taskAlpha1 = await prisma.task.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      milestoneId: msAlpha1.id,
      title: 'Implement Biometric Authentication & Session Management',
      description: 'Integrate FaceID / Fingerprint login with fallback to secure PIN and JWT refresh tokens.',
      priority: 'HIGH',
      status: 'COMPLETED',
      weight: 15,
      createdBy: tmAlice.id,
      dueDate: new Date('2026-10-25'),
    },
  });

  const taBob1 = await prisma.taskAssignee.create({
    data: {
      teamId: teamAlpha.id,
      taskId: taskAlpha1.id,
      teamMemberId: tmBob.id,
      responsibility: 'Authentication Flow Dev',
      allocatedWeight: 100,
      reportedProgress: 100,
      approvedProgress: 100,
    },
  });

  const taskAlpha2 = await prisma.task.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      milestoneId: msAlpha2.id,
      title: 'Build Interactive Product Catalog & Search Filter',
      description: 'High-performance virtualized grid view with category filters, sorting, and price range slider.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      weight: 25,
      createdBy: tmAlice.id,
      dueDate: new Date('2026-11-28'),
    },
  });

  const taBob2 = await prisma.taskAssignee.create({
    data: {
      teamId: teamAlpha.id,
      taskId: taskAlpha2.id,
      teamMemberId: tmBob.id,
      responsibility: 'Catalog Grid & Infinite Scroll',
      allocatedWeight: 60,
      reportedProgress: 75,
      approvedProgress: 60,
    },
  });

  const taCarol1 = await prisma.taskAssignee.create({
    data: {
      teamId: teamAlpha.id,
      taskId: taskAlpha2.id,
      teamMemberId: tmCarol.id,
      responsibility: 'Filter Drawer & Search UI',
      allocatedWeight: 40,
      reportedProgress: 80,
      approvedProgress: 70,
    },
  });

  const taskAlpha3 = await prisma.task.create({
    data: {
      teamId: teamAlpha.id,
      projectId: projectAlpha1.id,
      milestoneId: msAlpha2.id,
      title: 'Integrate Stripe Payment Sheet & Apple Pay',
      description: 'End-to-end checkout pipeline with webhooks, coupon redemption, and tax calculation.',
      priority: 'CRITICAL',
      status: 'TODO',
      weight: 35,
      createdBy: tmAlice.id,
      dueDate: new Date('2026-12-10'),
    },
  });

  await prisma.taskAssignee.create({
    data: {
      teamId: teamAlpha.id,
      taskId: taskAlpha3.id,
      teamMemberId: tmCarol.id,
      responsibility: 'Payment Gateway Integration',
      allocatedWeight: 100,
      reportedProgress: 0,
      approvedProgress: 0,
    },
  });

  // 10. Create Tasks & Assignees for Team Beta
  const taskBeta1 = await prisma.task.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      milestoneId: msBeta1.id,
      title: 'Provision Multi-AZ VPC and Subnets via Terraform',
      description: 'Infrastructure as Code template for staging and production VPCs with NAT Gateways.',
      priority: 'HIGH',
      status: 'COMPLETED',
      weight: 20,
      createdBy: tmDavid.id,
      dueDate: new Date('2026-10-18'),
    },
  });

  const taEmma1 = await prisma.taskAssignee.create({
    data: {
      teamId: teamBeta.id,
      taskId: taskBeta1.id,
      teamMemberId: tmEmma.id,
      responsibility: 'Terraform Modules',
      allocatedWeight: 100,
      reportedProgress: 100,
      approvedProgress: 100,
    },
  });

  const taskBeta2 = await prisma.task.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      milestoneId: msBeta2.id,
      title: 'Deploy EKS 1.30 Production Cluster & Ingress Controller',
      description: 'Configure managed node groups, AWS Load Balancer controller, and cert-manager for TLS.',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      weight: 30,
      createdBy: tmDavid.id,
      dueDate: new Date('2026-11-25'),
    },
  });

  const taEmma2 = await prisma.taskAssignee.create({
    data: {
      teamId: teamBeta.id,
      taskId: taskBeta2.id,
      teamMemberId: tmEmma.id,
      responsibility: 'Cluster Provisioning & Ingress',
      allocatedWeight: 70,
      reportedProgress: 65,
      approvedProgress: 50,
    },
  });

  const taFrank1 = await prisma.taskAssignee.create({
    data: {
      teamId: teamBeta.id,
      taskId: taskBeta2.id,
      teamMemberId: tmFrank.id,
      responsibility: 'Monitoring & Grafana Dashboards',
      allocatedWeight: 30,
      reportedProgress: 85,
      approvedProgress: 80,
    },
  });

  const taskBeta3 = await prisma.task.create({
    data: {
      teamId: teamBeta.id,
      projectId: projectBeta1.id,
      milestoneId: msBeta2.id,
      title: 'Automate Canary Deployments with ArgoCD',
      description: 'GitOps pipeline for progressive rollouts with automated metrics analysis and instant rollback.',
      priority: 'MEDIUM',
      status: 'TODO',
      weight: 25,
      createdBy: tmDavid.id,
      dueDate: new Date('2026-12-05'),
    },
  });

  await prisma.taskAssignee.create({
    data: {
      teamId: teamBeta.id,
      taskId: taskBeta3.id,
      teamMemberId: tmFrank.id,
      responsibility: 'Argo Rollouts Setup',
      allocatedWeight: 100,
      reportedProgress: 0,
      approvedProgress: 0,
    },
  });

  console.log('✅ Created Tasks & Assignees');

  // 11. Create Contributions & Reviews
  await prisma.contributionLog.create({
    data: {
      teamId: teamAlpha.id,
      taskAssigneeId: taBob1.id,
      submittedBy: tmBob.id,
      progressPercent: 100,
      hoursSpent: 18.5,
      description: 'Completed FaceID biometric prompt, keychain storage, and session token renewal.',
    },
  });

  await prisma.contributionLog.create({
    data: {
      teamId: teamAlpha.id,
      taskAssigneeId: taBob2.id,
      submittedBy: tmBob.id,
      progressPercent: 75,
      hoursSpent: 12.0,
      description: 'Implemented FlashList virtualized grid with memoized item cards and 60 FPS scrolling.',
    },
  });

  await prisma.taskReview.create({
    data: {
      teamId: teamAlpha.id,
      taskId: taskAlpha2.id,
      taskAssigneeId: taBob2.id,
      submittedBy: tmBob.id,
      reviewerId: tmAlice.id,
      status: 'PENDING',
      feedback: 'Great performance. Please ensure images have fallback placeholders.',
    },
  });

  await prisma.contributionLog.create({
    data: {
      teamId: teamBeta.id,
      taskAssigneeId: taEmma1.id,
      submittedBy: tmEmma.id,
      progressPercent: 100,
      hoursSpent: 22.0,
      description: 'Applied Terraform configurations for primary and failover VPCs across us-east-1 and us-west-2.',
    },
  });

  await prisma.contributionLog.create({
    data: {
      teamId: teamBeta.id,
      taskAssigneeId: taEmma2.id,
      submittedBy: tmEmma.id,
      progressPercent: 65,
      hoursSpent: 16.0,
      description: 'Deployed AWS Load Balancer controller and verified SSL certificate issuance via cert-manager.',
    },
  });

  await prisma.taskReview.create({
    data: {
      teamId: teamBeta.id,
      taskId: taskBeta2.id,
      taskAssigneeId: taEmma2.id,
      submittedBy: tmEmma.id,
      reviewerId: tmDavid.id,
      status: 'APPROVED',
      feedback: 'Validated TLS termination and path routing. Approved.',
      reviewedAt: new Date(),
    },
  });

  console.log('✅ Created Contributions & Reviews');

  // 12. Create Welcome Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: users[0].id, // Alice
        type: 'TASK_ASSIGNED',
        title: 'Welcome to TeamTrack!',
        message: 'You have been designated as Team Lead for Team Alpha.',
      },
      {
        userId: users[1].id, // Bob
        type: 'REVIEW_PENDING',
        title: 'Review Awaiting Approval',
        message: 'Your progress submission on "Build Interactive Product Catalog" is awaiting review.',
      },
      {
        userId: users[3].id, // David
        type: 'TASK_ASSIGNED',
        title: 'Welcome to TeamTrack!',
        message: 'You have been designated as Team Lead for Team Beta.',
      },
      {
        userId: users[4].id, // Emma
        type: 'WORK_APPROVED',
        title: 'Progress Approved!',
        message: 'David Kim approved your progress on "Deploy EKS 1.30 Production Cluster".',
      },
    ],
  });

  console.log('✅ Created Notifications');

  console.log('\n======================================================');
  console.log('🎉 RICH SEED COMPLETED SUCCESSFULLY IN SUPABASE!');
  console.log('======================================================');
  console.log('🔑 SUPER ADMIN:');
  console.log('   - tharsank2@gmail.com / Admin@123  (Platform Admin View)');
  console.log('\n👥 TEAM ALPHA:');
  console.log('   - alice@teamtrack.local / Password@123  (Team Lead)');
  console.log('   - bob@teamtrack.local   / Password@123  (Member)');
  console.log('   - carol@teamtrack.local / Password@123  (Member)');
  console.log('\n👥 TEAM BETA:');
  console.log('   - david@teamtrack.local / Password@123  (Team Lead)');
  console.log('   - emma@teamtrack.local  / Password@123  (Member)');
  console.log('   - frank@teamtrack.local / Password@123  (Member)');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
