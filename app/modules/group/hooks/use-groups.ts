import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import type { GroupWithRole } from './helpers/group-optimistic-updates'

/**
 * Hook to fetch all groups that the current user is a member of
 * Returns groups with role information
 */
export function useGroups() {
	const trpc = useTRPC()

	return useQuery({
		...trpc.group.getMyGroups.queryOptions(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	})
}

/**
 * Hook to get groups data with loading and error states
 * Provides a more convenient interface for components
 */
export function useGroupsData() {
	const { data: groups = [], isLoading, error, isError } = useGroups()

	const typedGroups = groups as GroupWithRole[]

	return {
		groups: typedGroups,
		isLoading,
		error,
		isError,
		hasGroups: typedGroups.length > 0,
	}
}
