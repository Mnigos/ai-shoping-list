import { google } from '@ai-sdk/google'
import type { TRPCRouterRecord } from '@trpc/server'
import { generateObject, streamObject } from 'ai'
import z from 'zod'
import { AddToShoppingListSchema } from '~/stores/shopping-list.store'
import { publicProcedure } from '../trpc'

const AddToShoppingListOutputSchema = z.object({
	items: z
		.array(AddToShoppingListSchema)
		.describe('The item to add to the shopping list'),
	message: z.string().describe('The message to the user'),
})

export const assistantRouter = {
	hello: publicProcedure.query(async () => 'Hello, world!'),
	addToShoppingList: publicProcedure
		.input(
			z.object({
				prompt: z.string(),
			}),
		)
		.mutation(async function* ({ input: { prompt } }) {
			const { partialObjectStream } = streamObject({
				model: google('gemini-2.5-flash-preview-04-17'),
				schema: AddToShoppingListOutputSchema,
				prompt: `
        You are a helpful assistant that can help me add items to my shopping list.
        I will give you a prompt and you will need to add the item to my shopping list. Please generate a object with name and amount then a message to the user.
        The prompt is: ${prompt}
        `,
			})

			for await (const chunk of partialObjectStream) {
				yield chunk
			}
		}),
} satisfies TRPCRouterRecord
