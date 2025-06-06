import type { ShoppingListItem } from '@prisma/client'
import type { QueryClient, QueryKey } from '@tanstack/react-query'

interface OptimisticUpdateConfig<
	TVariables,
	TContext = { previousItems: ShoppingListItem[] },
> {
	queryClient: QueryClient
	queryKey: QueryKey
	updateFn: (
		items: ShoppingListItem[],
		variables: TVariables,
	) => ShoppingListItem[]
	createContext?: (
		previousItems: ShoppingListItem[],
		variables: TVariables,
	) => TContext
}

export function createOptimisticUpdate<
	TVariables,
	TContext = { previousItems: ShoppingListItem[] },
>({
	queryClient,
	queryKey,
	updateFn,
	createContext,
}: OptimisticUpdateConfig<TVariables, TContext>) {
	return async (variables: TVariables) => {
		await queryClient.cancelQueries({ queryKey })

		const previousItems =
			queryClient.getQueryData<ShoppingListItem[]>(queryKey) ?? []

		queryClient.setQueryData<ShoppingListItem[]>(queryKey, old =>
			updateFn(old ?? [], variables),
		)

		const baseContext = { previousItems }
		const additionalContext = createContext?.(previousItems, variables)

		return additionalContext
			? { ...baseContext, ...additionalContext }
			: (baseContext as TContext)
	}
}

export function createOptimisticErrorHandler<
	TContext extends { previousItems: ShoppingListItem[] },
>(queryClient: QueryClient, queryKey: QueryKey) {
	return (err: unknown, variables: unknown, context: TContext | undefined) => {
		if (context?.previousItems)
			queryClient.setQueryData<ShoppingListItem[]>(
				queryKey,
				context.previousItems,
			)
	}
}

export function createOptimisticSettledHandler(
	queryClient: QueryClient,
	queryKey: QueryKey,
) {
	return () => {
		queryClient.invalidateQueries({ queryKey })
	}
}
