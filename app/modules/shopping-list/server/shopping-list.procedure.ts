import { protectedProcedure } from '~/lib/trpc/t'
import { ShoppingListService } from './shopping-list.service'

export const shoppingListProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		const service = new ShoppingListService(ctx)

		return next({
			ctx: {
				...ctx,
				service,
			},
		})
	},
)
