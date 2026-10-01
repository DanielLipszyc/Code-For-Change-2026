import { clerkClient } from '@clerk/nextjs/server';
import { supabase, isValidId } from './supabase';
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
 * Check whether the given user owns the row with the given ID.
 * Returns false if the row doesn't exist or has no user_id (legacy/anonymous).
 */
async function isOwner(
  table: 'submissions' | 'sightings',
  userId: string,
  rowId: string
): Promise<boolean> {
  try {
    if (!isValidId(rowId)) {
      return false;
    }

    const { data, error } = await supabase
      .from(table)
      .select('user_id')
      .eq('id', rowId)
      .maybeSingle();

    if (error) throw error;

    return !!data?.user_id && data.user_id === userId;
  } catch (error) {
    console.error(`Error checking ownership of ${table} row:`, error);
    return false;
  }
}

/**
 * Check if user can edit a specific submission
 * Only the owner can edit their own submissions
 */
export async function canEditSubmission(
  userId: string,
  submissionId: string
): Promise<boolean> {
  return isOwner('submissions', userId, submissionId);
}

/**
 * Check if user can delete a specific submission
 * Owner can delete their own, admins can delete any
 */
export async function canDeleteSubmission(
  userId: string,
  submissionId: string
): Promise<boolean> {
  if (await isAdmin(userId)) {
    return true;
  }
  return isOwner('submissions', userId, submissionId);
}

/**
 * Check if user can edit a specific sighting
 * Only the owner can edit their own sightings
 */
export async function canEditSighting(
  userId: string,
  sightingId: string
): Promise<boolean> {
  return isOwner('sightings', userId, sightingId);
}

/**
 * Check if user can delete a specific sighting
 * Owner can delete their own, admins can delete any
 */
export async function canDeleteSighting(
  userId: string,
  sightingId: string
): Promise<boolean> {
  if (await isAdmin(userId)) {
    return true;
  }
  return isOwner('sightings', userId, sightingId);
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
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}
