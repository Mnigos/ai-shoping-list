import type { TRPCRouterRecord } from '@trpc/server'
import {
	GenerateInviteCodeInputSchema,
	GenerateInviteLinkInputSchema,
	JoinViaCodeInputSchema,
	JoinViaTokenInputSchema,
	ValidateInviteCodeInputSchema,
	ValidateInviteTokenInputSchema,
} from './group-invite.service'
import {
	GetMembersInputSchema,
	LeaveGroupInputSchema,
	RemoveMemberInputSchema,
	UpdateRoleInputSchema,
} from './group-member.service'
import { groupProcedure } from './group.procedure'
import {
	CreateGroupInputSchema,
	DeleteGroupInputSchema,
	GetGroupDetailsInputSchema,
	TransferShoppingListInputSchema,
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

	transferShoppingList: groupProcedure
		.input(TransferShoppingListInputSchema)
		.mutation(async ({ ctx, input }) =>
			ctx.service.transferShoppingList(input),
		),

	generateInviteCode: groupProcedure
		.input(GenerateInviteCodeInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.generateInviteCode(input)),

	validateInviteCode: groupProcedure
		.input(ValidateInviteCodeInputSchema)
		.query(async ({ ctx, input }) => ctx.service.validateInviteCode(input)),

	joinViaCode: groupProcedure
		.input(JoinViaCodeInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.joinViaCode(input)),

	// New invite link endpoints
	generateInviteLink: groupProcedure
		.input(GenerateInviteLinkInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.generateInviteLink(input)),

	validateInviteToken: groupProcedure
		.input(ValidateInviteTokenInputSchema)
		.query(async ({ ctx, input }) => ctx.service.validateInviteToken(input)),

	joinViaToken: groupProcedure
		.input(JoinViaTokenInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.joinViaToken(input)),

	// Member management routes
	getMembers: groupProcedure
		.input(GetMembersInputSchema)
		.query(async ({ ctx, input }) => ctx.service.getMembers(input)),

	removeMember: groupProcedure
		.input(RemoveMemberInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.removeMember(input)),

	updateRole: groupProcedure
		.input(UpdateRoleInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.updateRole(input)),

	leaveGroup: groupProcedure
		.input(LeaveGroupInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.leaveGroup(input)),
} satisfies TRPCRouterRecord
