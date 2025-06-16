import { TRPCError } from '@trpc/server'

export const groupMapValues = [
	[
		'GROUP_NOT_FOUND',
		{
			code: 'NOT_FOUND',
			message: 'Group not found',
		},
	],
	[
		'GROUP_NOT_FOUND_OR_NOT_MEMBER',
		{
			code: 'NOT_FOUND',
			message: 'Group not found or you are not a member',
		},
	],
	[
		'ALREADY_MEMBER',
		{
			code: 'CONFLICT',
			message: 'You are already a member of this group',
		},
	],
	[
		'NOT_GROUP_MEMBER',
		{
			code: 'FORBIDDEN',
			message: 'You are not a member of this group',
		},
	],
	[
		'ADMIN_ONLY',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can perform this action',
		},
	],
	[
		'ADMIN_ONLY_UPDATE_GROUP',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can update group details',
		},
	],
	[
		'ADMIN_ONLY_DELETE_GROUP',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can delete groups',
		},
	],
	[
		'ADMIN_ONLY_REMOVE_MEMBERS',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can remove members',
		},
	],
	[
		'ADMIN_ONLY_UPDATE_ROLES',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can update member roles',
		},
	],
	[
		'ADMIN_ONLY_REGENERATE_INVITE',
		{
			code: 'FORBIDDEN',
			message: 'Only group admins can regenerate invite codes',
		},
	],
	[
		'MEMBER_NOT_FOUND',
		{
			code: 'NOT_FOUND',
			message: 'Member not found',
		},
	],
	[
		'PERSONAL_GROUP_CANNOT_DELETE',
		{
			code: 'BAD_REQUEST',
			message: 'Personal groups cannot be deleted',
		},
	],
	[
		'PERSONAL_GROUP_CANNOT_LEAVE',
		{
			code: 'BAD_REQUEST',
			message: 'Cannot leave personal group',
		},
	],
	[
		'ANONYMOUS_USER_CANNOT_JOIN',
		{
			code: 'FORBIDDEN',
			message: 'You must be signed in to join a group',
		},
	],
	[
		'GROUP_CREATION_FAILED',
		{
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to create group',
		},
	],
	[
		'INVITE_CODE_CONFLICT',
		{
			code: 'CONFLICT',
			message:
				'A group with this invite code already exists. Please try again.',
		},
	],
] as const satisfies [
	string,
	{
		code: typeof TRPCError.prototype.code
		message: string
	},
][]

export type GroupErrorType = (typeof groupMapValues)[number][0]

export class GroupError extends TRPCError {
	constructor(type: GroupErrorType) {
		const [, errorValue] = groupMapValues.find(value => value[0] === type) ?? []

		if (!errorValue) throw new Error('Invalid group error type')

		const { code, message } = errorValue

		super({ code, message })
	}
}
