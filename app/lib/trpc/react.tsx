import SuperJSON from 'superjson'

import {
	QueryClient,
	QueryClientProvider,
	defaultShouldDehydrateQuery,
} from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { type PropsWithChildren, cache, useState } from 'react'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { clientEnv } from '~/env.client'
import type { AppRouter } from '~/server/main'

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
			dehydrate: {
				serializeData: SuperJSON.serialize,
				shouldDehydrateQuery: query =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === 'pending',
			},
			hydrate: {
				deserializeData: SuperJSON.deserialize,
			},
		},
	})
}

let browserQueryClient: QueryClient | undefined = undefined

export const getQueryClient = cache(() => {
	if (typeof window === 'undefined') return makeQueryClient()

	browserQueryClient ??= makeQueryClient()

	return browserQueryClient
})

const getBaseUrl = cache(() => {
	if (typeof window !== 'undefined') return window.location.origin

	if (clientEnv?.VITE_VERCEL_URL) return `https://${clientEnv.VITE_VERCEL_URL}`

	return 'http://localhost:5173'
})

const links = [
	loggerLink({
		enabled: op =>
			process.env.NODE_ENV === 'development' ||
			(op.direction === 'down' && op.result instanceof Error),
	}),
	httpBatchLink({
		transformer: SuperJSON,
		url: `${getBaseUrl()}/api/trpc`,
		headers() {
			const headers = new Headers()
			headers.set('x-trpc-source', 'react')
			return headers
		},
	}),
]

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

export function TRPCReactProvider({ children }: PropsWithChildren) {
	const queryClient = getQueryClient()
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links,
		}),
	)

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		</QueryClientProvider>
	)
}

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
