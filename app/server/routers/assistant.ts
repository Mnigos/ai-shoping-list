import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod'
import { publicProcedure } from '../trpc'

export const assistantRouter = {
	hello: publicProcedure.query(async () => 'Hello, world!'),
} satisfies TRPCRouterRecord
