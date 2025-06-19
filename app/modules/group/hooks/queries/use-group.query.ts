import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useGroupQuery(groupId: string) {
	const trpc = useTRPC()

	return useQuery(trpc.group.getGroup.queryOptions({ id: groupId }))
}
