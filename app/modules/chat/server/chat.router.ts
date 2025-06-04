import type { TRPCRouterRecord } from '@trpc/server'
import { chatProcedure } from './chat.procedure'
import { AssistantInputSchema } from './chat.service'

export const chatRouter = {
	assistant: chatProcedure
		.input(AssistantInputSchema)
		.mutation(async function* ({ ctx, input }) {
			yield* ctx.service.assistant(input)
		}),
} satisfies TRPCRouterRecord
