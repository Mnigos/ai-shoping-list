import { authRouter } from '~/modules/auth/server/auth.router'
import { chatRouter } from '~/modules/chat/server/chat.router'
import { groupRouter } from '~/modules/group/server/group.router'
import { shoppingListRouter } from '~/modules/shopping-list/server/shopping-list.router'
import { createTRPCRouter } from './t'

export const appRouter = createTRPCRouter({
	auth: authRouter,
	chat: chatRouter,
	group: groupRouter,
	shoppingList: shoppingListRouter,
})
export type AppRouter = typeof appRouter
