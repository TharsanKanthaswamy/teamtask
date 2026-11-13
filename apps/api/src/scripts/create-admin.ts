import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface AdminInput {
  name: string;
  email: string;
  password: string;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createSuperAdmin() {
  console.log('\n🔐 TeamTrack Super Admin Bootstrap\n');
  console.log('This script creates the initial Super Administrator account.');
  console.log('⚠️  This should only be run ONCE during initial setup.\n');

  // Check if Super Admin already exists
  const existingAdmins = await prisma.platformAdmin.count();

  if (existingAdmins > 0) {
    console.log('❌ Error: A Super Admin already exists.');
    console.log('   For security reasons, additional admins cannot be created through this script.');
    console.log('   Use the Super Admin interface to manage administrators.\n');
    process.exit(1);
  }

  const input: AdminInput = {
    name: '',
    email: '',
    password: '',
  };

  // Collect input
  input.name = await prompt('Administrator Name: ');
  input.email = await prompt('Administrator Email: ');
  input.password = await prompt('Administrator Password (min 8 characters): ');

  // Validate
  if (!input.name || !input.email || !input.password) {
    console.log('\n❌ Error: All fields are required.\n');
    process.exit(1);
  }

  if (input.password.length < 8) {
    console.log('\n❌ Error: Password must be at least 8 characters.\n');
    process.exit(1);
  }

  if (!input.email.includes('@')) {
    console.log('\n❌ Error: Invalid email address.\n');
    process.exit(1);
  }

  // Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    console.log('\n❌ Error: A user with this email already exists.\n');
    process.exit(1);
  }

  console.log('\n⏳ Creating Super Admin account...');

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Create user and platform admin in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    const admin = await tx.platformAdmin.create({
      data: {
        userId: user.id,
        adminLevel: 'SUPER_ADMIN',
        enabled: true,
      },
    });

    return { user, admin };
  });

  console.log('\n✅ Super Admin account created successfully!\n');
  console.log('📧 Email:', result.user.email);
  console.log('👤 Name:', result.user.name);
  console.log('🔑 Admin Level:', result.admin.adminLevel);
  console.log('\n🚀 You can now log in to the TeamTrack platform.\n');
}

createSuperAdmin()
  .catch((error) => {
    console.error('\n❌ Error creating Super Admin:', error.message, '\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
