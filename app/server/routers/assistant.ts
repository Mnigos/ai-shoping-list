import { google } from '@ai-sdk/google'
import type { TRPCRouterRecord } from '@trpc/server'
import { streamObject } from 'ai'
import z from 'zod'
import { publicProcedure } from '../trpc'

const ShoppingListActionItemSchema = z.object({
	action: z
		.enum(['add', 'update', 'delete', 'complete'])
		.describe('The action to perform on this item'),
	name: z.string().describe('The name of the item'),
	amount: z
		.number()
		.optional()
		.describe(
			'The amount of the item (not required for delete/complete actions)',
		),
})

const CurrentShoppingListItemSchema = z.object({
	name: z.string(),
	amount: z.number(),
	isCompleted: z.boolean(),
})

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
	hello: publicProcedure.query(async () => 'Hello, world!'),
	addToShoppingList: publicProcedure
		.input(
			z.object({
				prompt: z.string(),
				currentItems: z.array(CurrentShoppingListItemSchema).optional(),
			}),
		)
		.mutation(async function* ({ input: { prompt, currentItems = [] } }) {
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
        - "add": Add new items to the shopping list or increase quantity of existing items
        - "update": Update the amount/quantity of existing items to a specific value (replaces current amount)
        - "delete": Remove items from the shopping list (can be partial removal)
        - "complete": Mark items as completed/done
        
        IMPORTANT: For delete actions, consider the current quantities:
        - If user wants to remove ALL of an item, use delete action without amount
        - If user wants to remove SOME of an item (partial removal), use update action with the remaining amount
        - For example: if there are 5 apples and user says "remove 2 apples", use update action with amount: 3
        
        For each action, provide the item name and amount (amount is optional for delete/complete actions).
        
        Examples:
        - "Add 2 apples and 1 milk" -> actions: [{action: "add", name: "apples", amount: 2}, {action: "add", name: "milk", amount: 1}]
        - "Remove bananas and mark bread as done" -> actions: [{action: "delete", name: "bananas"}, {action: "complete", name: "bread"}]
        - "Update milk to 2 bottles and add 3 oranges" -> actions: [{action: "update", name: "milk", amount: 2}, {action: "add", name: "oranges", amount: 3}]
        - "Remove 2 apples" (when there are 5 apples) -> actions: [{action: "update", name: "apples", amount: 3}]
        - "Remove all apples" -> actions: [{action: "delete", name: "apples"}]
        
        Current shopping list:
        ${currentItemsText}
        
        The prompt is: ${prompt}
        `,
			})

			for await (const chunk of partialObjectStream) {
				yield chunk
			}
		}),
} satisfies TRPCRouterRecord
