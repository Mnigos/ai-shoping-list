import { protectedProcedure } from '~/lib/trpc/t'
import { GroupInviteService } from './group-invite.service'
import { GroupMembershipService } from './group-membership.service'
import { GroupService } from './group.service'

export const groupProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const groupService = new GroupService(ctx)
	const groupMembershipService = new GroupMembershipService(ctx)
	const groupInviteService = new GroupInviteService(ctx)

	return next({
		ctx: {
			...ctx,
			groupService,
			groupMembershipService,
			groupInviteService,
		},
	})
})
