import { google } from '@ai-sdk/google'
import { TRPCError } from '@trpc/server'
import { streamObject } from 'ai'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import { ShoppingListActionSchema } from '~/modules/shopping-list/server/shopping-list-action.service'
import { assistantPromptFactory } from './chat.prompts'

export const MessageSchema = z.object({
	role: z.enum(['user', 'assistant']),
	content: z.string(),
	createdAt: z.date().optional(),
})
export type Message = z.infer<typeof MessageSchema>

const ChatResponseSchema = z.object({
	actions: z
		.array(ShoppingListActionSchema)
		.describe('Array of actions to perform on the shopping list'),
	message: z
		.string()
		.describe(
			'The message to the user. Should describe the actions that were performed.',
		),
})

export const AssistantInputSchema = z.object({
	prompt: z.string(),
	groupId: z.string(),
	recentMessages: z.array(MessageSchema).optional().default([]),
})
export type AssistantInput = z.infer<typeof AssistantInputSchema>

export class ChatService {
	constructor(private readonly ctx: ProtectedContext) {}

	private async verifyGroupMembership(groupId: string) {
		const membership = await this.ctx.prisma.groupMember.findUnique({
			where: {
				userId_groupId: {
					userId: this.ctx.user.id,
					groupId: groupId,
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

	async *assistant({ prompt, groupId, recentMessages }: AssistantInput) {
		// Verify user is a member of the group
		await this.verifyGroupMembership(groupId)

		const currentItems = await this.ctx.prisma.shoppingListItem.findMany({
			where: { groupId },
			orderBy: { createdAt: 'desc' },
		})

		const { partialObjectStream } = streamObject({
			model: google('gemini-2.5-flash-preview-04-17'),
			schema: ChatResponseSchema,
			prompt: assistantPromptFactory({
				currentItems,
				recentMessages,
				prompt,
			}),
		})

		for await (const chunk of partialObjectStream) {
			yield chunk
		}
	}
}
