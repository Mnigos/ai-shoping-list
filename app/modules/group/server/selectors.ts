import type { Prisma } from '@prisma/client'

export const userSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
} as const satisfies Prisma.UserSelect

export const memberSelect = {
	id: true,
	role: true,
	joinedAt: true,
	user: {
		select: userSelect,
	},
} as const satisfies Prisma.GroupMemberSelect

export const groupCountSelect = {
	shoppingListItems: true,
} as const satisfies Prisma.GroupSelect

export const groupBaseSelect = {
	id: true,
	name: true,
	description: true,
	inviteCode: true,
	isPersonal: true,
	createdAt: true,
	updatedAt: true,
} as const satisfies Prisma.GroupSelect

export const groupWithMembersSelect = {
	...groupBaseSelect,
	members: {
		select: memberSelect,
	},
	_count: {
		select: groupCountSelect,
	},
} as const satisfies Prisma.GroupSelect

export const groupWithMembersOrderedSelect = {
	...groupBaseSelect,
	members: {
		select: memberSelect,
		orderBy: {
			joinedAt: 'asc' as const,
		},
	},
	_count: {
		select: groupCountSelect,
	},
} as const satisfies Prisma.GroupSelect

export const membershipWithGroupSelect = {
	role: true,
	group: {
		select: groupWithMembersSelect,
	},
} as const satisfies Prisma.GroupMemberSelect

export const membershipWithGroupOrderedSelect = {
	role: true,
	group: {
		select: groupWithMembersOrderedSelect,
	},
} as const satisfies Prisma.GroupMemberSelect

export const groupValidationSelectFactory = (userId: string) =>
	({
		id: true,
		name: true,
		description: true,
		isPersonal: true,
		createdAt: true,
		_count: {
			select: {
				members: true,
				shoppingListItems: true,
			},
		},
		members: {
			where: { userId },
			select: { id: true },
		},
	}) satisfies Prisma.GroupSelect
