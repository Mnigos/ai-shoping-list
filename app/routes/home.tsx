import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Chat } from '~/components/chat'
import { ShoppingList } from '~/components/shopping-list'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import type { Route } from './+types/home'
import Example from './example'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs.request)

	await queryClient.prefetchQuery(trpc.assistant.hello.queryOptions())

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
			<Example />
		</HydrationBoundary>
	)
}
