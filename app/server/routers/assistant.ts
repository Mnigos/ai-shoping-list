import { google } from '@ai-sdk/google'
import type { TRPCRouterRecord } from '@trpc/server'
import { streamObject } from 'ai'
import z from 'zod'
import { protectedProcedure } from '../trpc'

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

export const assistantRouter = {
	chat: protectedProcedure
		.input(z.object({ prompt: z.string() }))
		.mutation(async function* ({ ctx, input: { prompt } }) {
			const currentItems = await ctx.prisma.shoppingListItem.findMany({
				where: { userId: ctx.user.id },
				orderBy: { createdAt: 'desc' },
			})

			const currentItemsText =
				currentItems.length > 0
					? `\n\nCurrent shopping list:\n${currentItems
							.map(
								item =>
									`- ${item.name}: ${item.amount} ${item.isCompleted ? '(completed)' : ''}`,
							)
							.join('\n')}`
					: '\n\nCurrent shopping list is empty.'

			const { partialObjectStream } = streamObject({
				model: google('gemini-2.5-flash-preview-04-17'),
				schema: ShoppingListActionSchema,
				prompt: `
        You are a helpful assistant that can help me manage my shopping list.
        I will give you a prompt and you need to determine what actions to perform and on which items.
        You can perform multiple different actions in a single response.
        
        Available actions:
        - "add": Add new items to the shopping list or increase quantity of existing items (REQUIRES amount)
        - "update": Update the amount/quantity of existing items to a specific value (REQUIRES amount)
        - "delete": Remove items from the shopping list (amount is optional)
        - "complete": Mark items as completed/done (amount is optional)
        
        IMPORTANT RULES:
        1. For "add" and "update" actions, you MUST always provide an amount (minimum 1)
        2. For "delete" and "complete" actions, amount is optional
        3. If no amount is specified by the user for add actions, default to 1
        4. For delete actions, consider the current quantities:
           - If user wants to remove ALL of an item, use delete action without amount
           - If user wants to remove SOME of an item (partial removal), use update action with the remaining amount
           - For example: if there are 5 apples and user says "remove 2 apples", use update action with amount: 3
        
        Examples:
        - "Add apples" -> actions: [{action: "add", name: "apples", amount: 1}]
        - "Add 2 apples and 1 milk" -> actions: [{action: "add", name: "apples", amount: 2}, {action: "add", name: "milk", amount: 1}]
        - "Remove bananas and mark bread as done" -> actions: [{action: "delete", name: "bananas"}, {action: "complete", name: "bread"}]
        - "Update milk to 2 bottles and add 3 oranges" -> actions: [{action: "update", name: "milk", amount: 2}, {action: "add", name: "oranges", amount: 3}]
        - "Remove 2 apples" (when there are 5 apples) -> actions: [{action: "update", name: "apples", amount: 3}]
        - "Remove all apples" -> actions: [{action: "delete", name: "apples"}]

        ${currentItemsText}
        
        The prompt is: ${prompt}
        `,
			})

			for await (const chunk of partialObjectStream) {
				yield chunk
			}
		}),
} satisfies TRPCRouterRecord
