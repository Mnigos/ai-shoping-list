import { createHash } from 'node:crypto'
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

// New schemas for invite links
export const GenerateInviteLinkInputSchema = z.object({
	groupId: z.string(),
	expiresInHours: z.number().min(1).max(8760).optional(), // Max 1 year
})
export type GenerateInviteLinkInput = z.infer<
	typeof GenerateInviteLinkInputSchema
>

export const ValidateInviteTokenInputSchema = z.object({
	token: z.string().min(1, 'Invite token is required'),
})
export type ValidateInviteTokenInput = z.infer<
	typeof ValidateInviteTokenInputSchema
>

export const JoinViaTokenInputSchema = z.object({
	token: z.string().min(1, 'Invite token is required'),
})
export type JoinViaTokenInput = z.infer<typeof JoinViaTokenInputSchema>

export interface InviteCodeValidationResult {
	id: string
	name: string
	description: string | null
	createdAt: Date
	memberCount: number
	itemCount: number
	isAlreadyMember: boolean
}

export interface InviteLinkResult {
	inviteUrl: string
	token: string
	expiresAt: Date
}

export interface InviteTokenPayload {
	groupId: string
	expiresAt: number // Unix timestamp
	signature: string
}

export class GroupInviteService {
	constructor(private readonly ctx: ProtectedContext) {}

	async validateInviteCodeExists(
		inviteCode: string,
		userId: string,
	): Promise<InviteCodeValidationResult> {
		// Get basic group info without the problematic nested member filter
		const group = await this.ctx.prisma.group.findUnique({
			where: { inviteCode },
			select: {
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
			},
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

		// Check membership with a separate, reliable query
		const membershipRecord = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId,
					groupId: group.id,
				},
			},
			select: { id: true },
		})

		const isAlreadyMember = !!membershipRecord

		return {
			id: group.id,
			name: group.name,
			description: group.description,
			createdAt: group.createdAt,
			memberCount: group._count?.members || 0,
			itemCount: group._count?.shoppingListItems || 0,
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
		if (!this.ctx.user?.id) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'User not authenticated',
			})
		}

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

	// New invite link methods
	private async verifyGroupAdminAccess(groupId: string) {
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
				message: 'Only group admins can generate invite links',
			})
		}

		if (membership.group.isPersonal) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Personal groups cannot have invite links',
			})
		}

		return membership
	}

	/**
	 * Generate a secure invite token for a group using nanoid
	 * Uses 6-character nanoid with letters and numbers only
	 */
	private async generateInviteToken(
		groupId: string,
		expiresInHours = 168, // 7 days default
	): Promise<string> {
		const { customAlphabet } = await import('nanoid')
		const generateToken = customAlphabet(
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			6,
		)

		const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000
		const token = generateToken()
		const payload = `${groupId}:${expiresAt}:${token}`

		// Create signature using HMAC-like approach with crypto
		const secret =
			process.env.INVITE_TOKEN_SECRET || 'default-secret-change-in-production'
		const signature = createHash('sha256')
			.update(payload + secret)
			.digest('hex')
			.substring(0, 16) // Use first 16 chars for shorter tokens

		const tokenPayload = `${payload}:${signature}`
		return Buffer.from(tokenPayload).toString('base64url')
	}

	/**
	 * Validate and parse an invite token
	 */
	private validateInviteTokenHelper(token: string): InviteTokenPayload {
		try {
			const decoded = Buffer.from(token, 'base64url').toString('utf-8')
			const [groupId, expiresAtStr, nanoidToken, signature] = decoded.split(':')

			if (!groupId || !expiresAtStr || !nanoidToken || !signature) {
				throw new Error('Invalid token format')
			}

			const expiresAt = Number.parseInt(expiresAtStr, 10)
			if (Number.isNaN(expiresAt)) {
				throw new Error('Invalid expiration timestamp')
			}

			// Verify signature
			const payload = `${groupId}:${expiresAt}:${nanoidToken}`
			const secret =
				process.env.INVITE_TOKEN_SECRET || 'default-secret-change-in-production'
			const expectedSignature = createHash('sha256')
				.update(payload + secret)
				.digest('hex')
				.substring(0, 16)

			if (signature !== expectedSignature) {
				throw new Error('Invalid token signature')
			}

			// Check if token is expired
			if (Date.now() > expiresAt) {
				throw new Error('Token has expired')
			}

			return {
				groupId,
				expiresAt,
				signature,
			}
		} catch (error) {
			throw new Error(
				`Invalid invite token: ${error instanceof Error ? error.message : 'Unknown error'}`,
			)
		}
	}

	/**
	 * Generate a full invite URL for a group
	 */
	private async generateInviteUrl(
		groupId: string,
		baseUrl: string,
		expiresInHours = 168,
	): Promise<string> {
		const token = await this.generateInviteToken(groupId, expiresInHours)
		return `${baseUrl}/join-group/${token}`
	}

	/**
	 * Check if a token is expired without throwing
	 */
	private isTokenExpired(token: string): boolean {
		try {
			const payload = this.validateInviteTokenHelper(token)
			return Date.now() > payload.expiresAt
		} catch {
			return true // Consider invalid tokens as expired
		}
	}

	async generateInviteLink(
		input: GenerateInviteLinkInput,
	): Promise<InviteLinkResult> {
		await this.verifyGroupAdminAccess(input.groupId)

		const expiresInHours = input.expiresInHours || 168 // Default 7 days
		const token = await this.generateInviteToken(input.groupId, expiresInHours)

		// Get base URL from environment or request
		const baseUrl = this.ctx.env?.VERCEL_URL
			? `https://${this.ctx.env.VERCEL_URL}`
			: 'http://localhost:3000'
		const inviteUrl = await this.generateInviteUrl(
			input.groupId,
			baseUrl,
			expiresInHours,
		)

		const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

		return {
			inviteUrl,
			token,
			expiresAt,
		}
	}

	async validateInviteToken(
		input: ValidateInviteTokenInput,
	): Promise<InviteCodeValidationResult> {
		try {
			const tokenPayload = this.validateInviteTokenHelper(input.token)

			// Use the existing validateInviteCodeExists method but with group ID lookup
			const group = await this.ctx.prisma.group.findUnique({
				where: { id: tokenPayload.groupId },
				select: groupValidationSelectFactory(this.ctx.user.id),
			})

			if (!group) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Group not found or invite link is invalid',
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
		} catch (error) {
			if (error instanceof Error) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: error.message,
				})
			}
			throw error
		}
	}

	async joinViaToken(input: JoinViaTokenInput) {
		// Validate the token and get group info
		const groupInfo = await this.validateInviteToken(input)

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

			// Return the group details
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
