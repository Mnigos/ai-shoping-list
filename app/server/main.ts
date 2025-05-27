import { createTRPCRouter } from './trpc'

import { assistantRouter } from './routers/assistant'

export const appRouter = createTRPCRouter({
	assistant: assistantRouter,
})
export type AppRouter = typeof appRouter
