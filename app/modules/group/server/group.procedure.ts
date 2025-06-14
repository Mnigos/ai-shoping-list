import { protectedProcedure } from '~/lib/trpc/t'
import { GroupService } from './group.service'

export const groupProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const service = new GroupService(ctx)

	return next({
		ctx: {
			...ctx,
			service,
		},
	})
})
