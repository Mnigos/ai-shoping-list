import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useCurrentUserQuery() {
	const trpc = useTRPC()

	return useQuery(trpc.auth.currentUser.queryOptions())
}
