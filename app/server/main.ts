import { assistantRouter } from './routers/assistant'
import { shoppingListRouter } from './routers/shopping-list'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
	assistant: assistantRouter,
	shoppingList: shoppingListRouter,
})
export type AppRouter = typeof appRouter
