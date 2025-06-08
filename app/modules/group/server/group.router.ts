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
} from './schemas'

export const groupRouter = {
	getMyGroups: groupProcedure
		.output(MyGroupsOutput)
		.query(async ({ ctx }) => ctx.service.getMyGroups()),

	getMyGroupsOverview: groupProcedure
		.output(MyGroupsOverviewOutput)
		.query(async ({ ctx }) => ctx.service.getMyGroupsOverview()),

	getGroup: groupProcedure
		.input(GetGroupInput)
		.output(GetGroupOutput)
		.query(async ({ ctx, input }) => ctx.service.getGroup(input)),

	getGroupDetails: groupProcedure
		.input(GetGroupInput)
		.output(MyGroupDetailsOutput)
		.query(async ({ ctx, input }) => ctx.service.getGroupDetails(input)),

	createGroup: groupProcedure
		.input(CreateGroupInput)
		.output(CreateGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.service.createGroup(input)),

	updateGroup: groupProcedure
		.input(UpdateGroupInput)
		.output(UpdateGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.service.updateGroup(input)),

	deleteGroup: groupProcedure
		.input(DeleteGroupInput)
		.output(DeleteGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.service.deleteGroup(input)),

	regenerateInviteCode: groupProcedure
		.input(RegenerateInviteCodeInput)
		.output(RegenerateInviteCodeOutput)
		.mutation(async ({ ctx, input }) =>
			ctx.service.regenerateInviteCode(input),
		),

	joinGroup: groupProcedure
		.input(JoinGroupInput)
		.output(JoinGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.service.joinGroup(input)),

	removeMember: groupProcedure
		.input(RemoveMemberInput)
		.output(RemoveMemberOutput)
		.mutation(async ({ ctx, input }) => ctx.service.removeMember(input)),

	updateRole: groupProcedure
		.input(UpdateRoleInput)
		.output(UpdateRoleOutput)
		.mutation(async ({ ctx, input }) => ctx.service.updateRole(input)),

	leaveGroup: groupProcedure
		.input(LeaveGroupInput)
		.output(LeaveGroupOutput)
		.mutation(async ({ ctx, input }) => ctx.service.leaveGroup(input)),
} satisfies TRPCRouterRecord
