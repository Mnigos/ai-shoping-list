import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTRPC } from '~/lib/trpc/react'

export function useJoinGroupMutation() {
	const trpc = useTRPC()
	const navigate = useNavigate()

	return useMutation(
		trpc.group.joinGroup.mutationOptions({
			onSuccess: ({ groupId }) => {
				navigate(`/groups/${groupId}`)
			},
		}),
	)
}
