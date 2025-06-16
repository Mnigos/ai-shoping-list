import type { TRPCRouterRecord } from '@trpc/server'
import { groupProcedure } from './group.procedure'
import {
	CreateGroupInput,
	CreateGroupOutput,
	DeleteGroupInput,
	DeleteGroupOutput,
	GetGroupInput,
	GetGroupOutput,
	JoinGroupInput,
	JoinGroupOutput,
	LeaveGroupInput,
	LeaveGroupOutput,
	MyGroupDetailsOutput,
	MyGroupsOutput,
	MyGroupsOverviewOutput,
	RegenerateInviteCodeInput,
	RegenerateInviteCodeOutput,
	RemoveMemberInput,
	RemoveMemberOutput,
	UpdateGroupInput,
	UpdateGroupOutput,
	UpdateRoleInput,
	UpdateRoleOutput,
	ValidateInviteCodeInput,
	ValidateInviteCodeOutput,
} from './schemas'

export const groupRouter = {
	getMyGroups: groupProcedure
		.output(MyGroupsOutput)
		.query(async ({ ctx }) => ctx.groupService.getMyGroups()),

	getMyGroupsOverview: groupProcedure
		.output(MyGroupsOverviewOutput)
		.query(async ({ ctx }) => ctx.groupService.getMyGroupsOverview()),

	getGroup: groupProcedure
		.input(GetGroupInput)
		.output(GetGroupOutput)
		.query(async ({ ctx, input }) => ctx.groupService.getGroup(input)),

	getGroupDetails: groupProcedure
		.input(GetGroupInput)
		.output(MyGroupDetailsOutput)
		.query(async ({ ctx, input }) => ctx.groupService.getGroupDetails(input)),

	createGroup: groupProcedure
		.input(CreateGroupInput)
		.output(CreateGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.groupService.createGroup(input)),

	updateGroup: groupProcedure
		.input(UpdateGroupInput)
		.output(UpdateGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.groupService.updateGroup(input)),

	deleteGroup: groupProcedure
		.input(DeleteGroupInput)
		.output(DeleteGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.groupService.deleteGroup(input)),

	regenerateInviteCode: groupProcedure
		.input(RegenerateInviteCodeInput)
		.output(RegenerateInviteCodeOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.groupService.regenerateInviteCode(input),
		),

	joinGroup: groupProcedure
		.input(JoinGroupInput)
		.output(JoinGroupOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.groupInviteService.joinGroup(input),
		),

	validateInviteCode: groupProcedure
		.input(ValidateInviteCodeInput)
		.output(ValidateInviteCodeOutput)
		.query(async ({ ctx, input }) =>
			ctx.groupInviteService.validateInviteCode(input),
		),

	removeMember: groupProcedure
		.input(RemoveMemberInput)
		.output(RemoveMemberOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.groupMembershipService.removeMember(input),
		),

	updateMemberRole: groupProcedure
		.input(UpdateRoleInput)
		.output(UpdateRoleOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.groupMembershipService.updateMemberRole(input),
		),

	leaveGroup: groupProcedure
		.input(LeaveGroupInput)
		.output(LeaveGroupOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.groupMembershipService.leaveGroup(input),
		),
} satisfies TRPCRouterRecord
