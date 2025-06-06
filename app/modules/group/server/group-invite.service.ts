import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	groupBaseSelect,
	groupValidationSelectFactory,
	groupWithMembersOrderedSelect,
} from './selectors'

export const GenerateInviteCodeInputSchema = z.object({
	groupId: z.string(),
})
export type GenerateInviteCodeInput = z.infer<
	typeof GenerateInviteCodeInputSchema
>

export const ValidateInviteCodeInputSchema = z.object({
	inviteCode: z.string().min(1, 'Invite code is required'),
})
export type ValidateInviteCodeInput = z.infer<
	typeof ValidateInviteCodeInputSchema
>

export const JoinViaCodeInputSchema = z.object({
	inviteCode: z.string().min(1, 'Invite code is required'),
})
export type JoinViaCodeInput = z.infer<typeof JoinViaCodeInputSchema>

export interface InviteCodeValidationResult {
	id: string
	name: string
	description: string | null
	createdAt: Date
	memberCount: number
	itemCount: number
	isAlreadyMember: boolean
}

export class GroupInviteService {
	constructor(private readonly ctx: ProtectedContext) {}

	async validateInviteCodeExists(
		inviteCode: string,
		userId: string,
	): Promise<InviteCodeValidationResult> {
		const group = await this.ctx.prisma.group.findUnique({
			where: { inviteCode },
			select: groupValidationSelectFactory(userId),
		})

		if (!group) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Invalid invite code',
			})
		}

		if (group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Cannot join personal groups',
			})
		}

		const isAlreadyMember = group.members.length > 0

		return {
			id: group.id,
			name: group.name,
			description: group.description,
			createdAt: group.createdAt,
			memberCount: group._count.members,
			itemCount: group._count.shoppingListItems,
			isAlreadyMember,
		}
	}

	async generateReadableInviteCode(): Promise<string> {
		// TODO: Refactor to use KV storage (Redis) for better performance
		// and automatic expiration handling
		const { customAlphabet } = await import('nanoid')
		const generateCode = customAlphabet(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			6,
		)
		return generateCode()
	}

	async ensureUniqueInviteCode(maxRetries = 5): Promise<string> {
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			const code = await this.generateReadableInviteCode()

			const existingGroup = await this.ctx.prisma.group.findUnique({
				where: { inviteCode: code },
				select: { id: true },
			})

			if (!existingGroup) {
				return code
			}
		}

		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to generate unique invite code after multiple attempts',
		})
	}

	async generateInviteCode(input: GenerateInviteCodeInput) {
		// First check if user is admin of the group
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: input.groupId,
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
				message: 'Only group admins can generate invite codes',
			})
		}

		if (membership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Personal groups cannot have invite codes',
			})
		}

		try {
			const newInviteCode = await this.ensureUniqueInviteCode()

			const updatedGroup = await this.ctx.prisma.group.update({
				where: { id: input.groupId },
				data: { inviteCode: newInviteCode },
				select: groupBaseSelect,
			})

			return updatedGroup
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

	async validateInviteCode(input: ValidateInviteCodeInput) {
		return await this.validateInviteCodeExists(
			input.inviteCode,
			this.ctx.user.id,
		)
	}

	async joinViaCode(input: JoinViaCodeInput) {
		// Validate the invite code and check if user is already a member
		const groupInfo = await this.validateInviteCodeExists(
			input.inviteCode,
			this.ctx.user.id,
		)

		if (groupInfo.isAlreadyMember) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'You are already a member of this group',
			})
		}

		try {
			// Add user as a member of the group
			await this.ctx.prisma.groupMember.create({
				data: {
					userId: this.ctx.user.id,
					groupId: groupInfo.id,
					role: 'MEMBER',
				},
			})

			// Return the group details - we need to get the full group details
			const groupDetails = await this.ctx.prisma.group.findUnique({
				where: { id: groupInfo.id },
				select: groupWithMembersOrderedSelect,
			})

			if (!groupDetails) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found',
				})
			}

			return {
				...groupDetails,
				myRole: 'MEMBER' as const,
			}
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002') {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'You are already a member of this group',
				})
			}

			throw error
		}
	}
}
