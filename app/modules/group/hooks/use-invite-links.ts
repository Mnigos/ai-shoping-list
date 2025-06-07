import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'

export function useGenerateInviteLinkMutation() {
	const trpc = useTRPC()

	return useMutation(
		trpc.group.generateInviteLink.mutationOptions({
			onSuccess: () => {
				// No need to invalidate queries as this doesn't affect group data
				// The link is generated on-demand and not stored
			},
		}),
	)
}

export function useValidateInviteTokenQuery(token: string) {
	const trpc = useTRPC()

	return trpc.group.validateInviteToken.useQuery(
		{ token },
		{
			enabled: !!token,
			retry: false, // Don't retry on invalid tokens
		},
	)
}

export function useJoinViaTokenMutation() {
	const trpc = useTRPC()

	return useMutation(
		trpc.group.joinViaToken.mutationOptions({
			onSuccess: () => {
				// Invalidate groups query to show the new group
				// This will be handled by the component
			},
		}),
	)
}
