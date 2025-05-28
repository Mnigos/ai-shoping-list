import { assistantRouter } from './routers/assistant'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
	assistant: assistantRouter,
})
export type AppRouter = typeof appRouter
