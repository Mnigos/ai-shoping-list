import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import { memberSelect } from './selectors'

export const GetMembersInputSchema = z.object({
	groupId: z.string(),
})
export type GetMembersInput = z.infer<typeof GetMembersInputSchema>

export const RemoveMemberInputSchema = z.object({
	groupId: z.string(),
	memberId: z.string(),
})
export type RemoveMemberInput = z.infer<typeof RemoveMemberInputSchema>

export const UpdateRoleInputSchema = z.object({
	groupId: z.string(),
	memberId: z.string(),
	role: z.enum(['ADMIN', 'MEMBER']),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>

export const LeaveGroupInputSchema = z.object({
	groupId: z.string(),
})
export type LeaveGroupInput = z.infer<typeof LeaveGroupInputSchema>

export class GroupMemberService {
	constructor(private readonly ctx: ProtectedContext) {}

	private async verifyGroupMembership(groupId: string) {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: groupId,
				},
			},
			select: {
				role: true,
				group: {
					select: {
						id: true,
						isPersonal: true,
					},
				},
			},
		})

		if (!membership) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You are not a member of this group',
			})
		}

		return membership
	}

	private async verifyAdminRole(groupId: string) {
		const membership = await this.verifyGroupMembership(groupId)

		if (membership.role !== 'ADMIN') {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'Only group admins can perform this action',
			})
		}

		return membership
	}

	async getMembers(input: GetMembersInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(input.groupId)

		const members = await this.ctx.prisma.groupMember.findMany({
			where: { groupId: input.groupId },
			select: memberSelect,
			orderBy: [
				{ role: 'desc' }, // ADMINs first
				{ joinedAt: 'asc' }, // Then by join date
			],
		})

		return members
	}

	async removeMember(input: RemoveMemberInput) {
		// Verify user is admin of the group
		const adminMembership = await this.verifyAdminRole(input.groupId)

		// Check if the group is personal (can't remove members from personal groups)
		if (adminMembership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Cannot remove members from personal groups',
			})
		}

		// Check if trying to remove themselves
		if (input.memberId === this.ctx.user.id) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Use leave group to remove yourself from the group',
			})
		}

		// Find the member to remove
		const memberToRemove = await this.ctx.prisma.groupMember.findUnique({
			where: {
				id: input.memberId,
				groupId: input.groupId,
			},
			select: {
				id: true,
				role: true,
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		if (!memberToRemove) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Member not found in this group',
			})
		}

		// Check if there would be no admins left after removal
		if (memberToRemove.role === 'ADMIN') {
			const adminCount = await this.ctx.prisma.groupMember.count({
				where: {
					groupId: input.groupId,
					role: 'ADMIN',
				},
			})

			if (adminCount <= 1) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot remove the last admin from the group',
				})
			}
		}

		// Remove the member
		await this.ctx.prisma.groupMember.delete({
			where: {
				id: input.memberId,
				groupId: input.groupId,
			},
		})

		return {
			success: true,
			removedMember: memberToRemove,
		}
	}

	async updateRole(input: UpdateRoleInput) {
		// Verify user is admin of the group
		const adminMembership = await this.verifyAdminRole(input.groupId)

		// Check if the group is personal (can't change roles in personal groups)
		if (adminMembership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Cannot change roles in personal groups',
			})
		}

		// Find the member to update
		const memberToUpdate = await this.ctx.prisma.groupMember.findUnique({
			where: {
				id: input.memberId,
				groupId: input.groupId,
			},
			select: {
				id: true,
				role: true,
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		if (!memberToUpdate) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Member not found in this group',
			})
		}

		// If demoting an admin, check if there would be no admins left
		if (memberToUpdate.role === 'ADMIN' && input.role === 'MEMBER') {
			const adminCount = await this.ctx.prisma.groupMember.count({
				where: {
					groupId: input.groupId,
					role: 'ADMIN',
				},
			})

			if (adminCount <= 1) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot demote the last admin in the group',
				})
			}
		}

		// Update the member's role
		const updatedMember = await this.ctx.prisma.groupMember.update({
			where: {
				id: input.memberId,
				groupId: input.groupId,
			},
			data: {
				role: input.role,
			},
			select: memberSelect,
		})

		return updatedMember
	}

	async leaveGroup(input: LeaveGroupInput) {
		// Verify user is a member of the group
		const membership = await this.verifyGroupMembership(input.groupId)

		// Check if the group is personal (can't leave personal groups)
		if (membership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Cannot leave your personal group',
			})
		}

		// If user is admin, check if there are other admins
		if (membership.role === 'ADMIN') {
			const adminCount = await this.ctx.prisma.groupMember.count({
				where: {
					groupId: input.groupId,
					role: 'ADMIN',
				},
			})

			if (adminCount <= 1) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message:
						'Cannot leave group as the last admin. Transfer admin rights first or delete the group.',
				})
			}
		}

		// Remove the user from the group
		await this.ctx.prisma.groupMember.delete({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.groupId,
				},
			},
		})

		return {
			success: true,
			leftGroupId: input.groupId,
		}
	}
}
