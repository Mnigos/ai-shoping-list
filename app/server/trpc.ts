import superjson from 'superjson'

import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'

import { prisma } from '~/server/prisma'
import { assistantRouter } from './routers/assistant'

export const createTRPCContext = async (opts: { headers: Headers }) => {
	const source = opts.headers.get('x-trpc-source') ?? 'unknown'

	return {
		prisma,
	}
}
type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter: ({ shape, error }) => ({
		...shape,
		data: {
			...shape.data,
			zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
		},
	}),
})

export const createCallerFactory = t.createCallerFactory
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
