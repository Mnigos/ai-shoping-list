import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupInviteService } from './group-invite.service'
import {
	groupWithMembersOrderedSelect,
	groupWithMembersSelect,
	membershipWithGroupOrderedSelect,
	membershipWithGroupSelect,
} from './selectors'

export const CreateGroupInputSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(50, 'Name must be 50 characters or less'),
	description: z
		.string()
		.max(200, 'Description must be 200 characters or less')
		.optional(),
})
export type CreateGroupInput = z.infer<typeof CreateGroupInputSchema>

export const UpdateGroupInputSchema = z.object({
	id: z.string(),
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
export type UpdateGroupInput = z.infer<typeof UpdateGroupInputSchema>

export const GetGroupDetailsInputSchema = z.object({
	id: z.string(),
})
export type GetGroupDetailsInput = z.infer<typeof GetGroupDetailsInputSchema>

export const DeleteGroupInputSchema = z.object({
	id: z.string(),
})
export type DeleteGroupInput = z.infer<typeof DeleteGroupInputSchema>

export class GroupService {
	private readonly inviteService: GroupInviteService

	constructor(private readonly ctx: ProtectedContext) {
		this.inviteService = new GroupInviteService(this.ctx)
	}

	async getMyGroups() {
		const groupMemberships = await this.ctx.prisma.groupMember.findMany({
			where: { userId: this.ctx.user.id },
			select: membershipWithGroupSelect,
			orderBy: {
				group: {
					createdAt: 'desc',
				},
			},
		})

		return groupMemberships.map(membership => ({
			...membership.group,
			myRole: membership.role,
		}))
	}

	async getGroupDetails(input: GetGroupDetailsInput) {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
				},
			},
			select: membershipWithGroupOrderedSelect,
		})

		if (!membership) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})
		}

		return {
			...membership.group,
			myRole: membership.role,
		}
	}

	async createGroup(input: CreateGroupInput) {
		try {
			const group = await this.ctx.prisma.group.create({
				data: {
					name: input.name,
					description: input.description,
					members: {
						create: {
							userId: this.ctx.user.id,
							role: 'ADMIN',
						},
					},
				},
				select: groupWithMembersSelect,
			})

			return {
				...group,
				myRole: 'ADMIN' as const,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002') {
				throw new TRPCError({
					code: 'CONFLICT',
					message:
						'A group with this invite code already exists. Please try again.',
				})
			}

			throw error
		}
	}

	async updateGroup(input: UpdateGroupInput) {
		// First check if user is admin of the group
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
				},
			},
			select: {
				role: true,
			},
		})

		if (!membership) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})
		}

		if (membership.role !== 'ADMIN') {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can update group details',
			})
		}

		try {
			const updatedGroup = await this.ctx.prisma.group.update({
				where: { id: input.id },
				data: {
					...(input.name && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
				},
				select: groupWithMembersOrderedSelect,
			})

			return {
				...updatedGroup,
				myRole: membership.role,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025') {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})
			}

			throw error
		}
	}

	async deleteGroup(input: DeleteGroupInput) {
		// First check if user is admin of the group
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.id,
				},
			},
			select: {
				role: true,
				group: {
					select: {
						isPersonal: true,
					},
				},
			},
		})

		if (!membership) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Group not found or you are not a member',
			})
		}

		if (membership.role !== 'ADMIN') {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can delete groups',
			})
		}

		if (membership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Personal groups cannot be deleted',
			})
		}

		try {
			await this.ctx.prisma.group.delete({
				where: { id: input.id },
			})

			return { success: true }
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2025') {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})
			}

			throw error
		}
	}

	// Delegate invite-related methods to the invite service
	async generateInviteCode(input: { groupId: string }) {
		return await this.inviteService.generateInviteCode(input)
	}

	async validateInviteCode(input: { inviteCode: string }) {
		return await this.inviteService.validateInviteCode(input)
	}

	async joinViaCode(input: { inviteCode: string }) {
		return await this.inviteService.joinViaCode(input)
	}
}
