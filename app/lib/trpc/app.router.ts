import { chatRouter } from '~/modules/chat/server/chat.router'
import { shoppingListRouter } from '~/modules/shopping-list/server/shopping-list.router'
import { createTRPCRouter } from './t'

export const appRouter = createTRPCRouter({
	chat: chatRouter,
	shoppingList: shoppingListRouter,
})
export type AppRouter = typeof appRouter
