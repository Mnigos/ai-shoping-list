import { google } from '@ai-sdk/google'
import { streamObject } from 'ai'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import { assistantPromptFactory } from './chat.prompts'

export const MessageSchema = z.object({
	role: z.enum(['user', 'assistant']),
	content: z.string(),
	createdAt: z.date(),
})
export type Message = z.infer<typeof MessageSchema>

const ShoppingListActionItemSchema = z
	.object({
		action: z
			.enum(['add', 'update', 'delete', 'complete'])
			.describe('The action to perform on this item'),
		name: z.string().describe('The name of the item'),
		amount: z
			.number()
			.min(1, 'Amount must be at least 1')
			.describe(
				'The amount of the item (required for add/update actions, optional for delete/complete actions)',
			)
			.optional(),
	})
	.refine(
		data => {
			if ((data.action === 'add' || data.action === 'update') && !data.amount) {
				return false
			}
			return true
		},
		{
			message: 'Amount is required for add and update actions',
			path: ['amount'],
		},
	)

const ShoppingListActionSchema = z.object({
	actions: z
		.array(ShoppingListActionItemSchema)
		.describe('Array of actions to perform on the shopping list'),
	message: z
		.string()
		.describe(
			'The message to the user. Should describe the actions that were performed.',
		),
})

export const AssistantInputSchema = z.object({
	prompt: z.string(),
	recentMessages: z.array(MessageSchema).optional().default([]),
})
export type AssistantInput = z.infer<typeof AssistantInputSchema>

export class ChatService {
	constructor(private readonly ctx: ProtectedContext) {}

	async *assistant({ prompt, recentMessages }: AssistantInput) {
		const currentItems = await this.ctx.prisma.shoppingListItem.findMany({
			where: { userId: this.ctx.user.id },
			orderBy: { createdAt: 'desc' },
		})

		const { partialObjectStream } = streamObject({
			model: google('gemini-2.5-flash-preview-04-17'),
			schema: ShoppingListActionSchema,
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
