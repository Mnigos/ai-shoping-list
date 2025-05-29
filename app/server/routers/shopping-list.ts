import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod'
import {
	ShoppingListActionSchema,
	handleAddAction,
	handleCompleteAction,
	handleDeleteAction,
	handleUpdateAction,
} from '../helpers/shopping-list'
import { protectedProcedure } from '../trpc'

export const shoppingListRouter = {
	getItems: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.shoppingListItem.findMany({
			where: { userId: ctx.user.id },
			orderBy: { createdAt: 'desc' },
		})
	}),

	executeActions: protectedProcedure
		.input(z.object({ actions: z.array(ShoppingListActionSchema) }))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.$transaction(async tx => {
				for (const action of input.actions)
					switch (action.action) {
						case 'add':
							await handleAddAction(tx, ctx.user.id, action)
							break
						case 'update':
							await handleUpdateAction(tx, ctx.user.id, action)
							break
						case 'delete':
							await handleDeleteAction(tx, ctx.user.id, action)
							break
						case 'complete':
							await handleCompleteAction(tx, ctx.user.id, action)
							break
					}

				return tx.shoppingListItem.findMany({
					where: { userId: ctx.user.id },
					orderBy: { createdAt: 'desc' },
				})
			})
		}),

	addItem: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, 'Name is required'),
				amount: z.number().min(1, 'Amount must be at least 1').default(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				return ctx.prisma.shoppingListItem.create({
					data: {
						name: input.name,
						amount: input.amount,
						userId: ctx.user.id,
					},
				})
			} catch (error) {
				if (error instanceof Error && 'code' in error && error.code === 'P2002')
					throw new Error(
						`Item "${input.name}" already exists in your shopping list`,
					)

				throw error
			}
		}),

	updateItem: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				amount: z.number().min(1, 'Amount must be at least 1'),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.shoppingListItem.update({
				where: { id: input.id, userId: ctx.user.id },
				data: { amount: input.amount },
			})
		}),

	toggleComplete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.shoppingListItem.findUnique({
				where: { id: input.id, userId: ctx.user.id },
			})

			if (!item) throw new Error('Item not found')

			return ctx.prisma.shoppingListItem.update({
				where: { id: input.id, userId: ctx.user.id },
				data: { isCompleted: !item.isCompleted },
			})
		}),

	deleteItem: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.shoppingListItem.delete({
				where: { id: input.id, userId: ctx.user.id },
			})
		}),
} satisfies TRPCRouterRecord
