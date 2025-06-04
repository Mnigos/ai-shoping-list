import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { Chat } from '~/modules/chat/components/chat'
import { ShoppingList } from '~/modules/shopping-list/components/shopping-list'
import type { Route } from './+types/home.route'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)

	await queryClient.prefetchQuery(trpc.shoppingList.getItems.queryOptions())

	return {
		queryClient: dehydrate(queryClient),
	}
}

export default function Home({
	loaderData: { queryClient },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<main className="container mx-auto grid grid-cols-2 gap-8 p-4">
				<ShoppingList />
				<Chat />
			</main>
		</HydrationBoundary>
	)
}
