import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useMyGroupsQuery() {
	const trpc = useTRPC()

	return useQuery(trpc.group.getMyGroups.queryOptions())
}
