import { useCallback, useEffect, useState } from 'react'
import {
	findGroupById,
	getDefaultActiveGroupId,
	hasOnlyPersonalGroup,
	isValidGroupId,
} from './helpers/group-helpers'
import { useGroupsData } from './use-groups'

const ACTIVE_GROUP_STORAGE_KEY = 'activeGroupId'

/**
 * Hook to manage the currently active group with localStorage persistence
 * Handles group selection logic and fallbacks
 */
export function useActiveGroup() {
	const { groups, isLoading } = useGroupsData()
	const [activeGroupId, setActiveGroupIdState] = useState<string | null>(() => {
		if (typeof window === 'undefined') return null
		return localStorage.getItem(ACTIVE_GROUP_STORAGE_KEY)
	})

	// Get the active group object
	const activeGroup = activeGroupId
		? findGroupById(groups, activeGroupId)
		: null

	// Set active group and persist to localStorage
	const setActiveGroup = useCallback((groupId: string | null) => {
		setActiveGroupIdState(groupId)
		if (typeof window !== 'undefined') {
			if (groupId) {
				localStorage.setItem(ACTIVE_GROUP_STORAGE_KEY, groupId)
			} else {
				localStorage.removeItem(ACTIVE_GROUP_STORAGE_KEY)
			}
		}
	}, [])

	// Auto-select appropriate group when groups load or change
	useEffect(() => {
		if (isLoading || groups.length === 0) return

		// If no active group is set, or the current active group is invalid, set a default
		if (!activeGroupId || !isValidGroupId(groups, activeGroupId)) {
			const defaultGroupId = getDefaultActiveGroupId(groups)
			if (defaultGroupId) {
				setActiveGroup(defaultGroupId)
			}
		}
	}, [groups, activeGroupId, isLoading, setActiveGroup])

	// Helper to check if user should see group interface
	const shouldShowGroupInterface = !hasOnlyPersonalGroup(groups)

	return {
		activeGroupId,
		activeGroup,
		setActiveGroup,
		shouldShowGroupInterface,
		isLoading,
	}
}

/**
 * Hook to get the active group with additional computed properties
 */
export function useActiveGroupData() {
	const {
		activeGroup,
		activeGroupId,
		setActiveGroup,
		shouldShowGroupInterface,
		isLoading,
	} = useActiveGroup()
	const { groups } = useGroupsData()

	return {
		activeGroup,
		activeGroupId,
		setActiveGroup,
		shouldShowGroupInterface,
		isLoading,
		// Additional computed properties
		isPersonalGroup: activeGroup?.isPersonal ?? false,
		canManageGroup: activeGroup?.myRole === 'ADMIN',
		groupName: activeGroup?.name ?? '',
		availableGroups: groups,
	}
}
