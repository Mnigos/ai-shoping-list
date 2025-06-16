import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useGroupDetailsQuery(groupId: string) {
	const trpc = useTRPC()

	return useQuery(trpc.group.getGroupDetails.queryOptions({ id: groupId }))
}
