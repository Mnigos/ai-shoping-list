import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { LoaderFunctionArgs } from 'react-router'
import { appRouter } from '~/server/main'
import { createCallerFactory, createTRPCContext } from '~/server/trpc'
import { getQueryClient } from './react'

const createContext = (opts: { headers: Headers }) => {
	const headers = new Headers(opts.headers)
	headers.set('x-trpc-source', 'server-loader')
	return createTRPCContext({
		headers,
	})
}

const createCaller = createCallerFactory(appRouter)
export const caller = async (loaderArgs: LoaderFunctionArgs) =>
	createCaller(await createContext({ headers: loaderArgs.request.headers }))

export async function createTRPC(loaderArgs: LoaderFunctionArgs) {
	return createTRPCOptionsProxy({
		ctx: () => createContext({ headers: loaderArgs.request.headers }),
		queryClient: getQueryClient,
		router: appRouter,
	})
}
