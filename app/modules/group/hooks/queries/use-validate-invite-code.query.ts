import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useValidateInviteCodeQuery(inviteCode: string) {
	const trpc = useTRPC()

	return useQuery(trpc.group.validateInviteCode.queryOptions({ inviteCode }))
}
