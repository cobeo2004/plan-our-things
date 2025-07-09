import { createBrowserClient } from "@/lib/pocketbase";
import { GroupMembersRoleOptions } from "@/types/pocketbase-types";

/**
 * Check if the current user is an admin or owner of the group that the trip belongs to
 */
export async function isUserGroupAdmin(
  tripId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) return false;

  const pb = createBrowserClient();

  try {
    // Get the trip to find its group
    const trip = await pb.collection("trips").getOne(tripId, {
      fields: "group,created_by",
    });

    // Get the group to check if user is the owner
    const group = await pb.collection("groups").getOne(trip.group, {
      fields: "created_by",
    });

    // If user is the group owner, they have admin rights
    if (group.created_by === userId) {
      return true;
    }

    // Check if user is an admin member of the group
    const memberRecord = await pb
      .collection("group_members")
      .getFirstListItem(`group="${trip.group}" && user="${userId}"`, {
        fields: "role",
      })
      .catch(() => null);

    return memberRecord?.role === GroupMembersRoleOptions.admin;
  } catch (error) {
    console.error("Error checking user admin status:", error);
    return false;
  }
}

/**
 * Check if the current user can edit/delete a timeline item
 * (Users can only edit/delete their own timeline items)
 */
export function canEditTimelineItem(
  timelineItem: { created_by?: string },
  userId?: string
): boolean {
  if (!userId || !timelineItem.created_by) return false;
  return timelineItem.created_by === userId;
}

/**
 * Check if the current user can edit/delete a poll option
 * (Users can edit their own options, or poll creator can edit any option)
 */
export function canEditPollOption(
  pollOption: { submitted_by?: string },
  poll: { created_by?: string },
  userId?: string
): boolean {
  if (!userId) return false;

  // User can edit their own options
  if (pollOption.submitted_by === userId) return true;

  // Poll creator can edit any option
  if (poll.created_by === userId) return true;

  return false;
}

/**
 * Cache for group admin status to avoid repeated API calls
 */
const adminStatusCache = new Map<
  string,
  { result: boolean; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cached version of isUserGroupAdmin
 */
export async function isUserGroupAdminCached(
  tripId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) return false;

  const cacheKey = `${tripId}-${userId}`;
  const cached = adminStatusCache.get(cacheKey);

  // Return cached result if it's still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  // Fetch fresh data
  const result = await isUserGroupAdmin(tripId, userId);

  // Cache the result
  adminStatusCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });

  return result;
}

/**
 * Clear the admin status cache (useful when user permissions change)
 */
export function clearAdminStatusCache(tripId?: string, userId?: string): void {
  if (tripId && userId) {
    const cacheKey = `${tripId}-${userId}`;
    adminStatusCache.delete(cacheKey);
  } else {
    adminStatusCache.clear();
  }
}
