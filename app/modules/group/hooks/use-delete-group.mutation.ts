import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useTRPC } from '~/lib/trpc/react'

export function useDeleteGroupMutation() {
	const trpc = useTRPC()
	const navigate = useNavigate()

	return useMutation(
		trpc.group.deleteGroup.mutationOptions({
			onSuccess: () => {
				navigate('/groups')
			},
		}),
	)
}
