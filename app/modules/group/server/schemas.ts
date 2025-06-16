import { GroupRole } from '@prisma/client'
import { z } from 'zod/v4'

export const GroupOption = z.object({
	id: z.string(),
	name: z.string(),
	isPersonal: z.boolean(),
})
export type GroupOption = z.infer<typeof GroupOption>

export const Group = GroupOption.extend({
	description: z.string().nullable(),
	membersCount: z.number(),
	myRole: z.enum(GroupRole),
	createdAt: z.date(),
})
export type Group = z.infer<typeof Group>

export const GroupMember = z.object({
	role: z.enum(GroupRole),
	name: z.string(),
	image: z.string().optional(),
	userId: z.string(),
	joinedAt: z.date(),
})
export type GroupMember = z.infer<typeof GroupMember>

export const MyGroupsOutput = z.array(GroupOption)
export type MyGroupsOutput = z.infer<typeof MyGroupsOutput>

export const MyGroupsOverviewOutput = z.array(Group)
export type MyGroupsOverviewOutput = z.infer<typeof MyGroupsOverviewOutput>

export const GetGroupInput = z.object({
	id: z.string(),
})
export type GetGroupInput = z.infer<typeof GetGroupInput>

export const GetGroupOutput = Group
export type GetGroupOutput = z.infer<typeof GetGroupOutput>

export const GetGroupDetailsInput = GetGroupInput
export type GetGroupDetailsInput = z.infer<typeof GetGroupDetailsInput>

export const MyGroupDetailsOutput = Group.extend({
	inviteCode: z.string().optional(),
	createdAt: z.date(),
	members: z.array(GroupMember),
})
export type MyGroupDetailsOutput = z.infer<typeof MyGroupDetailsOutput>

export const CreateGroupInput = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(50, 'Name must be 50 characters or less'),
	description: z
		.string()
		.max(200, 'Description must be 200 characters or less')
		.optional(),
})
export type CreateGroupInput = z.infer<typeof CreateGroupInput>

export const CreateGroupOutput = Group
export type CreateGroupOutput = z.infer<typeof CreateGroupOutput>

export const UpdateGroupInput = GetGroupInput.extend({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(50, 'Name must be 50 characters or less')
		.optional(),
	description: z
		.string()
		.max(200, 'Description must be 200 characters or less')
		.optional(),
})
export type UpdateGroupInput = z.infer<typeof UpdateGroupInput>

export const UpdateGroupOutput = Group
export type UpdateGroupOutput = z.infer<typeof UpdateGroupOutput>

export const DeleteGroupInput = GetGroupInput
export type DeleteGroupInput = z.infer<typeof DeleteGroupInput>

export const DeleteGroupOutput = z.object({
	success: z.boolean(),
})
export type DeleteGroupOutput = z.infer<typeof DeleteGroupOutput>

export const RegenerateInviteCodeInput = GetGroupInput
export type RegenerateInviteCodeInput = z.infer<
	typeof RegenerateInviteCodeInput
>

export const RegenerateInviteCodeOutput = z.object({
	inviteCode: z.string(),
})
export type RegenerateInviteCodeOutput = z.infer<
	typeof RegenerateInviteCodeOutput
>

export const JoinGroupInput = z.object({
	inviteCode: z.string(),
})
export type JoinGroupInput = z.infer<typeof JoinGroupInput>

export const JoinGroupOutput = z.object({
	groupId: z.string(),
})
export type JoinGroupOutput = z.infer<typeof JoinGroupOutput>

export const RemoveMemberInput = z.object({
	groupId: z.string(),
	memberId: z.string(),
})
export type RemoveMemberInput = z.infer<typeof RemoveMemberInput>

export const RemoveMemberOutput = z.object({
	success: z.boolean(),
})
export type RemoveMemberOutput = z.infer<typeof RemoveMemberOutput>

export const UpdateRoleInput = RemoveMemberInput.extend({
	role: z.enum(GroupRole),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleInput>

export const UpdateRoleOutput = RemoveMemberOutput
export type UpdateRoleOutput = z.infer<typeof UpdateRoleOutput>

export const LeaveGroupInput = GetGroupInput
export type LeaveGroupInput = z.infer<typeof LeaveGroupInput>

export const LeaveGroupOutput = z.object({
	success: z.boolean(),
})
export type LeaveGroupOutput = z.infer<typeof LeaveGroupOutput>

export const ValidateInviteCodeInput = z.object({
	inviteCode: z.string(),
})
export type ValidateInviteCodeInput = z.infer<typeof ValidateInviteCodeInput>

export const ValidateInviteCodeOutput = z.object({
	group: Group.omit({ myRole: true }).extend({
		isMember: z.boolean(),
	}),
})
export type ValidateInviteCodeOutput = z.infer<typeof ValidateInviteCodeOutput>
