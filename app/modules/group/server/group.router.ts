import type { TRPCRouterRecord } from '@trpc/server'
import {
	GenerateInviteCodeInputSchema,
	JoinViaCodeInputSchema,
	ValidateInviteCodeInputSchema,
} from './group-invite.service'
import { groupProcedure } from './group.procedure'
import {
	CreateGroupInputSchema,
	DeleteGroupInputSchema,
	GetGroupDetailsInputSchema,
	UpdateGroupInputSchema,
} from './group.service'

export const groupRouter = {
	getMyGroups: groupProcedure.query(async ({ ctx }) =>
		ctx.service.getMyGroups(),
	),

	getGroupDetails: groupProcedure
		.input(GetGroupDetailsInputSchema)
		.query(async ({ ctx, input }) => ctx.service.getGroupDetails(input)),

	createGroup: groupProcedure
		.input(CreateGroupInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.createGroup(input)),

	updateGroup: groupProcedure
		.input(UpdateGroupInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.updateGroup(input)),

	deleteGroup: groupProcedure
		.input(DeleteGroupInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.deleteGroup(input)),

	generateInviteCode: groupProcedure
		.input(GenerateInviteCodeInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.generateInviteCode(input)),

	validateInviteCode: groupProcedure
		.input(ValidateInviteCodeInputSchema)
		.query(async ({ ctx, input }) => ctx.service.validateInviteCode(input)),

	joinViaCode: groupProcedure
		.input(JoinViaCodeInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.joinViaCode(input)),
} satisfies TRPCRouterRecord
