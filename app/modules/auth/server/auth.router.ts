import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure } from '~/lib/trpc/t'

export const authRouter = {
	currentUser: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user
	}),
} satisfies TRPCRouterRecord
