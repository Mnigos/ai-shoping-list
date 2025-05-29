import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	createOptimisticErrorHandler,
	createOptimisticSettledHandler,
	createOptimisticUpdate,
} from './helpers/optimistic-updates'

export function useToggleCompleteMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.shoppingList.getItems.queryKey()

	const optimisticUpdate = createOptimisticUpdate({
		queryClient,
		queryKey,
		updateFn: (items, variables: { id: string }) =>
			items.map(item =>
				item.id === variables.id
					? { ...item, isCompleted: !item.isCompleted }
					: item,
			),
	})

	return useMutation(
		trpc.shoppingList.toggleComplete.mutationOptions({
			onMutate: optimisticUpdate,
			onError: createOptimisticErrorHandler(queryClient, queryKey),
			onSettled: createOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
