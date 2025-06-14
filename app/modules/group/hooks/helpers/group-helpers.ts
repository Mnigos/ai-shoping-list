import type { GroupWithRole } from './group-optimistic-updates'

/**
 * Check if a user has only a personal group (or no groups)
 * Users with only personal groups should see the interface as if they're not in any group
 */
export function hasOnlyPersonalGroup(groups: GroupWithRole[]): boolean {
	if (groups.length === 0) return true
	if (groups.length === 1 && groups[0]?.isPersonal) return true
	return false
}

/**
 * Check if a user is an admin of a specific group
 */
export function isGroupAdmin(group: GroupWithRole): boolean {
	return group.myRole === 'ADMIN'
}

/**
 * Get the user's personal group from their groups list
 */
export function getPersonalGroup(
	groups: GroupWithRole[],
): GroupWithRole | undefined {
	return groups.find(group => group.isPersonal)
}

/**
 * Get non-personal groups (collaborative groups)
 */
export function getCollaborativeGroups(
	groups: GroupWithRole[],
): GroupWithRole[] {
	return groups.filter(group => !group.isPersonal)
}

/**
 * Check if a user can create groups (not anonymous)
 * This will be used with the auth status hook
 */
export function canCreateGroups(
	isAuthenticated: boolean,
	isAnonymous: boolean,
): boolean {
	return isAuthenticated && !isAnonymous
}

/**
 * Get the default active group ID
 * Returns the first non-personal group, or personal group if no collaborative groups exist
 */
export function getDefaultActiveGroupId(
	groups: GroupWithRole[],
): string | null {
	if (groups.length === 0) return null

	// Prefer collaborative groups over personal groups
	const collaborativeGroups = getCollaborativeGroups(groups)
	if (collaborativeGroups.length > 0) {
		return collaborativeGroups[0]?.id ?? null
	}

	// Fall back to personal group
	const personalGroup = getPersonalGroup(groups)
	return personalGroup?.id ?? null
}

/**
 * Find a group by ID in the groups list
 */
export function findGroupById(
	groups: GroupWithRole[],
	groupId: string,
): GroupWithRole | undefined {
	return groups.find(group => group.id === groupId)
}

/**
 * Check if a group ID is valid within the user's groups
 */
export function isValidGroupId(
	groups: GroupWithRole[],
	groupId: string | null,
): boolean {
	if (!groupId) return false
	return groups.some(group => group.id === groupId)
}
