import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	createOptimisticErrorHandler,
	createOptimisticSettledHandler,
	createOptimisticUpdate,
} from './helpers/optimistic-updates'

export function useUpdateItemMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.shoppingList.getItems.queryKey()

	const optimisticUpdate = createOptimisticUpdate({
		queryClient,
		queryKey,
		updateFn: (items, variables: { id: string; amount: number }) =>
			items.map(item =>
				item.id === variables.id ? { ...item, amount: variables.amount } : item,
			),
	})

	return useMutation(
		trpc.shoppingList.updateItem.mutationOptions({
			onMutate: optimisticUpdate,
			onError: createOptimisticErrorHandler(queryClient, queryKey),
			onSettled: createOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
