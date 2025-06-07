import type { Group, GroupRole } from '@prisma/client'
import type { QueryClient, QueryKey } from '@tanstack/react-query'

// Type for group with role information (matches what the service returns)
export type GroupWithRole = Group & { myRole: GroupRole }

interface GroupOptimisticUpdateConfig<
	TVariables,
	TContext = { previousGroups: GroupWithRole[] },
> {
	queryClient: QueryClient
	queryKey: QueryKey
	updateFn: (groups: GroupWithRole[], variables: TVariables) => GroupWithRole[]
	createContext?: (
		previousGroups: GroupWithRole[],
		variables: TVariables,
	) => TContext
}

export function createGroupOptimisticUpdate<
	TVariables,
	TContext = { previousGroups: GroupWithRole[] },
>({
	queryClient,
	queryKey,
	updateFn,
	createContext,
}: GroupOptimisticUpdateConfig<TVariables, TContext>) {
	return async (variables: TVariables) => {
		await queryClient.cancelQueries({ queryKey })

		const previousGroups =
			queryClient.getQueryData<GroupWithRole[]>(queryKey) ?? []

		queryClient.setQueryData<GroupWithRole[]>(queryKey, old =>
			updateFn(old ?? [], variables),
		)

		const baseContext = { previousGroups }
		const additionalContext = createContext?.(previousGroups, variables)

		return additionalContext
			? { ...baseContext, ...additionalContext }
			: (baseContext as TContext)
	}
}

export function createGroupOptimisticErrorHandler<
	TContext extends { previousGroups: GroupWithRole[] },
>(queryClient: QueryClient, queryKey: QueryKey) {
	return (err: unknown, variables: unknown, context: TContext | undefined) => {
		if (context?.previousGroups)
			queryClient.setQueryData<GroupWithRole[]>(
				queryKey,
				context.previousGroups,
			)
	}
}

export function createGroupOptimisticSettledHandler(
	queryClient: QueryClient,
	queryKey: QueryKey,
) {
	return () => {
		queryClient.invalidateQueries({ queryKey })
	}
}
