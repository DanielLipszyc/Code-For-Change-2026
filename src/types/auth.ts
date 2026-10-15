/**
 * User role types for authorization
 */
export type UserRole = 'user' | 'admin';

/**
 * Extended submission interface with authentication fields
 */
export interface AuthenticatedSubmission {
  userId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * User information returned from API
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl?: string;
}
