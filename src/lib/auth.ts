import { clerkClient } from '@clerk/nextjs/server';
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';
import { UserRole } from '@/types/auth';

/**
 * Get user role from Clerk metadata
 * Defaults to 'user' if no role is set
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (user.publicMetadata.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user'; // Default to user role on error
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

/**
 * Check if user can edit a specific submission
 * Only the owner can edit their own submissions
 */
export async function canEditSubmission(
  userId: string,
  submissionId: string
): Promise<boolean> {
  try {
    // Validate ObjectId
    if (!ObjectId.isValid(submissionId)) {
      return false;
    }

    const db = await getDb();
    const submission = await db.collection('submissions').findOne({
      _id: new ObjectId(submissionId),
    });

    // Can't edit if submission doesn't exist or has no userId (legacy)
    if (!submission || !submission.userId) {
      return false;
    }

    // Check ownership
    return submission.userId === userId;
  } catch (error) {
    console.error('Error checking edit permission:', error);
    return false;
  }
}

/**
 * Check if user can delete a specific submission
 * Owner can delete their own, admins can delete any
 */
export async function canDeleteSubmission(
  userId: string,
  submissionId: string
): Promise<boolean> {
  try {
    // Admins can delete anything
    if (await isAdmin(userId)) {
      return true;
    }

    // Validate ObjectId
    if (!ObjectId.isValid(submissionId)) {
      return false;
    }

    const db = await getDb();
    const submission = await db.collection('submissions').findOne({
      _id: new ObjectId(submissionId),
    });

    // Can't delete if submission doesn't exist
    if (!submission) {
      return false;
    }

    // Can't delete if no userId (legacy anonymous submission) and not admin
    if (!submission.userId) {
      return false;
    }

    // Check ownership
    return submission.userId === userId;
  } catch (error) {
    console.error('Error checking delete permission:', error);
    return false;
  }
}

/**
 * Check if user can edit a specific sighting
 * Only the owner can edit their own sightings
 */
export async function canEditSighting(
  userId: string,
  sightingId: string
): Promise<boolean> {
  try {
    // Validate ObjectId
    if (!ObjectId.isValid(sightingId)) {
      return false;
    }

    const db = await getDb();
    const sighting = await db.collection('sightings').findOne({
      _id: new ObjectId(sightingId),
    });

    // Can't edit if sighting doesn't exist or has no userId (legacy)
    if (!sighting || !sighting.userId) {
      return false;
    }

    // Check ownership
    return sighting.userId === userId;
  } catch (error) {
    console.error('Error checking edit permission:', error);
    return false;
  }
}

/**
 * Check if user can delete a specific sighting
 * Owner can delete their own, admins can delete any
 */
export async function canDeleteSighting(
  userId: string,
  sightingId: string
): Promise<boolean> {
  try {
    // Admins can delete anything
    if (await isAdmin(userId)) {
      return true;
    }

    // Validate ObjectId
    if (!ObjectId.isValid(sightingId)) {
      return false;
    }

    const db = await getDb();
    const sighting = await db.collection('sightings').findOne({
      _id: new ObjectId(sightingId),
    });

    // Can't delete if sighting doesn't exist
    if (!sighting) {
      return false;
    }

    // Can't delete if no userId (legacy anonymous sighting) and not admin
    if (!sighting.userId) {
      return false;
    }

    // Check ownership
    return sighting.userId === userId;
  } catch (error) {
    console.error('Error checking delete permission:', error);
    return false;
  }
}

/**
 * Set user role (server-side only, for admin promotion)
 * This should only be called from admin scripts or admin-protected routes
 */
export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { role },
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}
