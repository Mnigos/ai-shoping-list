import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getQueryClient } from '~/lib/trpc/react'
import { createTRPC } from '~/lib/trpc/server'
import { Button } from '~/shared/components/ui/button'
import type { Route } from './+types/home.route'

export function meta() {
	return [
		{ title: 'AI Shopping List' },
		{ name: 'description', content: 'Collaborative AI-powered shopping lists' },
	]
}

export async function loader(loaderArgs: Route.LoaderArgs) {
	const queryClient = getQueryClient()
	const trpc = await createTRPC(loaderArgs)

	return {
		queryClient: dehydrate(queryClient),
	}
}

export default function Home({
	loaderData: { queryClient },
}: Route.ComponentProps) {
	return (
		<HydrationBoundary state={queryClient}>
			<main className="container mx-auto p-6">
				<div className="py-12 text-center">
					<h1 className="mb-4 font-bold text-4xl">
						Welcome to AI Shopping List
					</h1>
					<p className="mb-8 text-gray-600 text-lg">
						Create and manage collaborative shopping lists with AI assistance
					</p>
					<Link to="/groups">
						<Button size="lg">View My Groups</Button>
					</Link>
				</div>
			</main>
		</HydrationBoundary>
	)
}
