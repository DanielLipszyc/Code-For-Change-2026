import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/auth";

/**
 * GET /api/users/me
 * Get current user information and role
 */
export async function GET() {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Get user role from metadata
    const role = await getUserRole(userId);

    // Return user info
    return NextResponse.json({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
      role,
      imageUrl: user.imageUrl,
      welcomeTourSeen: user.publicMetadata.welcomeTourSeen === true,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Mark the welcome tour as seen for the current account
 */
export async function PATCH() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { welcomeTourSeen: true },
    });

    return NextResponse.json({ welcomeTourSeen: true });
  } catch (error) {
    console.error("Error updating user info:", error);
    return NextResponse.json(
      { error: "Failed to update user information" },
      { status: 500 }
    );
  }
}
