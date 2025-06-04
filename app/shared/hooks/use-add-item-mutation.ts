import type { ShoppingListItem } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '~/lib/auth-client'
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
	userId: string
}): ShoppingListItem => ({
	id: `temp-${crypto.randomUUID()}`,
	name: variables.name,
	amount: variables.amount ?? 1,
	isCompleted: false,
	createdAt: new Date(),
	updatedAt: new Date(),
	userId: variables.userId,
})

export function useAddItemMutation() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const queryKey = trpc.shoppingList.getItems.queryKey()
	const { data } = authClient.useSession()

	const optimisticUpdate = createOptimisticUpdate<
		{ name: string; amount?: number },
		AddItemContext
	>({
		queryClient,
		queryKey,
		updateFn: (items, variables) => {
			const optimisticItem = createOptimisticItem({
				...variables,
				userId: data?.user.id ?? 'temp-user',
			})
			return [optimisticItem, ...items]
		},
		createContext: (previousItems, variables) => {
			const optimisticItem = createOptimisticItem({
				...variables,
				userId: data?.user.id ?? 'temp-user',
			})
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
