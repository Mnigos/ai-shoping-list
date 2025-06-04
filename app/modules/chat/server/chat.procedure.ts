import { protectedProcedure } from '~/lib/trpc/t'
import { ChatService } from './chat.service'

export const chatProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const service = new ChatService(ctx)

	return next({
		ctx: {
			...ctx,
			service,
		},
	})
})
