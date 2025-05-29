import type { PrismaClient } from '@prisma/client'
import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod'
import { protectedProcedure } from '../trpc'

type PrismaTransaction = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

const ShoppingListActionSchema = z.object({
	action: z.enum(['add', 'update', 'delete', 'complete']),
	name: z.string(),
	amount: z.number().min(1, 'Amount must be at least 1').optional(),
})

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
				for (const action of input.actions) {
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
				if (
					error instanceof Error &&
					'code' in error &&
					error.code === 'P2002'
				) {
					throw new Error(
						`Item "${input.name}" already exists in your shopping list`,
					)
				}
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
				where: { id: input.id },
				data: { amount: input.amount },
			})
		}),

	toggleComplete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.shoppingListItem.findUnique({
				where: { id: input.id },
			})

			if (!item) throw new Error('Item not found')

			return ctx.prisma.shoppingListItem.update({
				where: { id: input.id },
				data: { isCompleted: !item.isCompleted },
			})
		}),

	deleteItem: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.shoppingListItem.delete({
				where: { id: input.id },
			})
		}),
} satisfies TRPCRouterRecord

async function handleAddAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	if (!action.amount || action.amount < 1) {
		throw new Error('Amount must be at least 1 for add action')
	}

	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (existingItem) {
		await tx.shoppingListItem.update({
			where: { id: existingItem.id },
			data: { amount: existingItem.amount + action.amount },
		})
	} else {
		await tx.shoppingListItem.create({
			data: {
				name: action.name,
				amount: action.amount,
				userId,
			},
		})
	}
}

async function handleUpdateAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	if (!action.amount || action.amount < 1) {
		throw new Error('Amount must be at least 1 for update action')
	}

	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) {
		throw new Error(`Item "${action.name}" not found`)
	}

	await tx.shoppingListItem.update({
		where: { id: existingItem.id },
		data: { amount: action.amount },
	})
}

async function handleDeleteAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) {
		throw new Error(`Item "${action.name}" not found`)
	}

	await tx.shoppingListItem.delete({
		where: { id: existingItem.id },
	})
}

async function handleCompleteAction(
	tx: PrismaTransaction,
	userId: string,
	action: z.infer<typeof ShoppingListActionSchema>,
) {
	const existingItem = await tx.shoppingListItem.findFirst({
		where: {
			userId,
			name: {
				equals: action.name,
				mode: 'insensitive',
			},
		},
	})

	if (!existingItem) {
		throw new Error(`Item "${action.name}" not found`)
	}

	await tx.shoppingListItem.update({
		where: { id: existingItem.id },
		data: { isCompleted: !existingItem.isCompleted },
	})
}
