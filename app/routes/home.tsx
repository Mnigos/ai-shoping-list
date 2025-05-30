import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Chat } from '~/components/chat'
import { ShoppingList } from '~/components/shopping-list'
import { auth } from '~/lib/auth.server'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import type { Route } from './+types/home'

export function meta() {
	return [
		{ title: 'New React Router App' },
		{ name: 'description', content: 'Welcome to React Router!' },
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)

	const session = await auth.api.getSession({
		headers: loaderArgs.request.headers,
	})

	if (!session) {
		const { headers: responseHeaders } = await auth.api.signInAnonymous({
			headers: loaderArgs.request.headers,
			returnHeaders: true,
		})

		const setCookieHeader = responseHeaders.get('set-cookie')

		if (setCookieHeader)
			throw new Response(null, {
				status: 302,
				headers: {
					Location: loaderArgs.request.url,
					'Set-Cookie': setCookieHeader,
				},
			})
	}

	if (session?.user)
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
