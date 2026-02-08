import { clerkClient } from '@clerk/clerk-sdk-node';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('Error: CLERK_SECRET_KEY environment variable is not set');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

// Note: clerkClient is already initialized, no need to call it as a function
const clerk = clerkClient;

async function promoteToAdmin(emailOrUserId: string) {
  try {
    let userId: string;

    // Check if input is an email or userId
    if (emailOrUserId.includes('@')) {
      // It's an email, find the user
      const users = await clerk.users.getUserList({ emailAddress: [emailOrUserId] });

      if (!users || users.length === 0) {
        console.error(`Error: No user found with email: ${emailOrUserId}`);
        process.exit(1);
      }

      userId = users[0].id;
      console.log(`Found user: ${users[0].emailAddresses[0].emailAddress}`);
    } else {
      // Assume it's a userId
      userId = emailOrUserId;
    }

    // Update user's public metadata to set role as admin
    await clerk.users.updateUser(userId, {
      publicMetadata: { role: 'admin' },
    });

    console.log(`✅ Successfully promoted user to admin!`);
    console.log(`User ID: ${userId}`);
    console.log(`Role: admin`);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    process.exit(1);
  }
}

// Get email or userId from command line arguments
const emailOrUserId = process.argv[2];

if (!emailOrUserId) {
  console.error('Usage: npm run promote-admin <email or userId>');
  console.error('Example: npm run promote-admin user@example.com');
  process.exit(1);
}

promoteToAdmin(emailOrUserId);
