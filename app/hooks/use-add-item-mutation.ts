import type { ShoppingListItem } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '~/lib/trpc/react'
import {
	createOptimisticErrorHandler,
	createOptimisticSettledHandler,
	createOptimisticUpdate,
} from './helpers/optimistic-updates'

interface AddItemContext {
	previousItems: ShoppingListItem[]
	optimisticItem: ShoppingListItem
}

const createOptimisticItem = (variables: {
	name: string
	amount?: number
}): ShoppingListItem => ({
	id: `temp-${Date.now()}`,
	name: variables.name,
	amount: variables.amount ?? 1,
	isCompleted: false,
	createdAt: new Date(),
	updatedAt: new Date(),
	userId: 'temp-user',
})

export function useAddItemMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.shoppingList.getItems.queryKey()

	const optimisticUpdate = createOptimisticUpdate<
		{ name: string; amount?: number },
		AddItemContext
	>({
		queryClient,
		queryKey,
		updateFn: (items, variables) => {
			const optimisticItem = createOptimisticItem(variables)
			return [optimisticItem, ...items]
		},
		createContext: (previousItems, variables) => {
			const optimisticItem = createOptimisticItem(variables)
			return { previousItems, optimisticItem }
		},
	})

	return useMutation(
		trpc.shoppingList.addItem.mutationOptions({
			onMutate: optimisticUpdate,
			onError: createOptimisticErrorHandler<AddItemContext>(
				queryClient,
				queryKey,
			),
			onSuccess: (data, variables, context) => {
				queryClient.setQueryData<ShoppingListItem[]>(
					queryKey,
					old =>
						old?.map(item =>
							item.id === context?.optimisticItem?.id ? data : item,
						) ?? [],
				)
			},
			onSettled: createOptimisticSettledHandler(queryClient, queryKey),
		}),
	)
}
