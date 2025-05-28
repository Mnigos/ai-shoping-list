import { google } from '@ai-sdk/google'
import type { TRPCRouterRecord } from '@trpc/server'
import { generateObject } from 'ai'
import z from 'zod'
import { AddToShoppingListSchema } from '~/stores/shopping-list.store'
import { publicProcedure } from '../trpc'

const AddToShoppingListOutputSchema = AddToShoppingListSchema.extend({
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
		.output(AddToShoppingListOutputSchema)
		.mutation(async ({ input: { prompt } }) => {
			const { object } = await generateObject({
				model: google('gemini-2.5-flash-preview-04-17'),
				schema: AddToShoppingListOutputSchema,
				prompt: `
        You are a helpful assistant that can help me add items to my shopping list.
        I will give you a prompt and you will need to add the item to my shopping list.
        The prompt is: ${prompt}
        `,
			})

			return object
		}),
} satisfies TRPCRouterRecord
