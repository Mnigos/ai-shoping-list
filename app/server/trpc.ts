import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { auth } from '~/lib/auth.server'
import { prisma } from '~/lib/prisma'

export async function createTRPCContext(opts: { headers: Headers }) {
	const session = await auth.api.getSession({
		headers: opts.headers,
	})

	const source = opts.headers.get('x-trpc-source') ?? 'unknown'
	console.log('>>> tRPC Request from', source, 'by', session?.user.name)
	return {
		prisma,
		user: session?.user,
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
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' })

	return next({
		ctx: {
			...ctx,
			user: ctx.user,
		},
	})
})
