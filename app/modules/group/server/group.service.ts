import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import { GroupInviteService } from './group-invite.service'
import { GroupMemberService } from './group-member.service'
import {
	groupBaseSelect,
	groupWithMembersOrderedSelect,
	groupWithMembersSelect,
	membershipWithGroupOrderedSelect,
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

export const TransferShoppingListInputSchema = z.object({
	fromGroupId: z.string(),
	toGroupId: z.string(),
})
export type TransferShoppingListInput = z.infer<
	typeof TransferShoppingListInputSchema
>

export class GroupService {
	private readonly inviteService: GroupInviteService
	private readonly memberService: GroupMemberService

	constructor(private readonly ctx: ProtectedContext) {
		this.inviteService = new GroupInviteService(this.ctx)
		this.memberService = new GroupMemberService(this.ctx)
	}

	async getMyGroups() {
		// Try a simpler approach - get memberships first, then get groups separately
		const memberships = await this.ctx.prisma.groupMember.findMany({
			where: { userId: this.ctx.user.id },
			select: {
				role: true,
				groupId: true,
			},
		})

		console.log('Raw memberships:', JSON.stringify(memberships, null, 2))

		// Get the groups separately
		const groupIds = memberships.map(m => m.groupId)
		const groups = await this.ctx.prisma.group.findMany({
			where: { id: { in: groupIds } },
			select: groupWithMembersSelect,
			orderBy: { createdAt: 'desc' },
		})

		console.log('Groups found:', JSON.stringify(groups, null, 2))

		// Combine the data
		const result = groups.map(group => {
			const membership = memberships.find(m => m.groupId === group.id)
			return {
				...group,
				myRole: membership?.role || 'MEMBER',
			}
		})

		console.log('getMyGroups result:', JSON.stringify(result, null, 2))
		return result
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
			const result = await this.ctx.prisma.$transaction(async tx => {
				// Create the group first
				const group = await tx.group.create({
					data: {
						name: input.name,
						description: input.description,
					},
					select: groupBaseSelect,
				})

				// Create the membership
				await tx.groupMember.create({
					data: {
						userId: this.ctx.user.id,
						groupId: group.id,
						role: 'ADMIN',
					},
				})

				// Fetch the complete group with members
				const completeGroup = await tx.group.findUnique({
					where: { id: group.id },
					select: groupWithMembersSelect,
				})

				if (!completeGroup) {
					throw new Error('Failed to create group')
				}

				return completeGroup
			})

			const finalResult = {
				...result,
				myRole: 'ADMIN' as const,
			}

			console.log('Created group:', JSON.stringify(finalResult, null, 2))
			return finalResult
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

	// New invite link methods
	async generateInviteLink(input: {
		groupId: string
		expiresInHours?: number
	}) {
		return await this.inviteService.generateInviteLink(input)
	}

	async validateInviteToken(input: { token: string }) {
		return await this.inviteService.validateInviteToken(input)
	}

	async joinViaToken(input: { token: string }) {
		return await this.inviteService.joinViaToken(input)
	}

	// Delegate member-related methods to the member service
	async getMembers(input: { groupId: string }) {
		return await this.memberService.getMembers(input)
	}

	async removeMember(input: { groupId: string; memberId: string }) {
		return await this.memberService.removeMember(input)
	}

	async updateRole(input: {
		groupId: string
		memberId: string
		role: 'ADMIN' | 'MEMBER'
	}) {
		return await this.memberService.updateRole(input)
	}

	async leaveGroup(input: { groupId: string }) {
		return await this.memberService.leaveGroup(input)
	}

	async transferShoppingList(input: TransferShoppingListInput) {
		// Verify user is a member of both groups
		const memberships = await this.ctx.prisma.groupMember.findMany({
			where: {
				userId: this.ctx.user.id,
				groupId: { in: [input.fromGroupId, input.toGroupId] },
			},
			select: {
				groupId: true,
				role: true,
			},
		})

		if (memberships.length !== 2) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You must be a member of both groups to transfer items',
			})
		}

		// Transfer all shopping list items from source to destination group
		const updatedItems = await this.ctx.prisma.shoppingListItem.updateMany({
			where: {
				groupId: input.fromGroupId,
				createdById: this.ctx.user.id, // Only transfer items created by this user
			},
			data: {
				groupId: input.toGroupId,
			},
		})

		return { transferredCount: updatedItems.count }
	}
}
