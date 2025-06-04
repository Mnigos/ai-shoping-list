import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from 'react-router'

import type { PropsWithChildren } from 'react'
import type { Route } from './+types/root'
import { clientEnv } from './env.client'
import { TRPCReactProvider } from './lib/trpc/react'

import './app.css'
import { NavigationBar } from '~/shared/components/navigation-bar'
import { auth } from './lib/auth.server'

export const links: Route.LinksFunction = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
]

export async function loader(loaderArgs: Route.LoaderArgs) {
	const session = await auth.api.getSession({
		headers: loaderArgs.request.headers,
	})

	if (!session) {
		const { headers, response } = await auth.api.signInAnonymous({
			headers: loaderArgs.request.headers,
			returnHeaders: true,
		})

		const setCookieHeader = headers.get('set-cookie')

		if (setCookieHeader)
			throw new Response(JSON.stringify(response), {
				status: 302,
				headers: {
					Location: loaderArgs.request.url,
					'Set-Cookie': setCookieHeader,
				},
			})
	}

	return session
}

export function Layout({ children }: PropsWithChildren) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="dark">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<TRPCReactProvider>
			<NavigationBar user={loaderData?.user} />

			<Outlet />

			<ReactQueryDevtools />
		</TRPCReactProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!'
	let details = 'An unexpected error occurred.'
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error'
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details
	} else if (clientEnv?.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
