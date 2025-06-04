import type { PrismaClient } from '@prisma/client'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'

export type PrismaTransaction = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export const ShoppingListActionSchema = z.object({
	action: z.enum(['add', 'update', 'delete', 'complete']),
	name: z.string(),
	amount: z.number().min(1, 'Amount must be at least 1').optional(),
})
export type ShoppingListActionSchema = z.infer<typeof ShoppingListActionSchema>

interface ShoppingListActionParams {
	tx: PrismaTransaction
	userId: string
	action: ShoppingListActionSchema
}

export class ShoppingListActionsService {
	constructor(private readonly ctx: ProtectedContext) {}

	execute(actions: z.infer<typeof ShoppingListActionSchema>[]) {
		const userId = this.ctx.user.id

		return this.ctx.prisma.$transaction(async tx => {
			for (const action of actions)
				switch (action.action) {
					case 'add':
						await this.handleAddAction({ tx, userId, action })
						break
					case 'update':
						await this.handleUpdateAction({ tx, userId, action })
						break
					case 'delete':
						await this.handleDeleteAction({ tx, userId, action })
						break
					case 'complete':
						await this.handleCompleteAction({ tx, userId, action })
						break
				}

			return tx.shoppingListItem.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
			})
		})
	}

	async handleAddAction(params: ShoppingListActionParams) {
		const { tx, userId, action } = params

		if (!action.amount || action.amount < 1)
			throw new Error('Amount must be at least 1 for add action')

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				userId,
				name: {
					equals: action.name,
					mode: 'insensitive',
				},
			},
		})

		if (existingItem)
			await tx.shoppingListItem.update({
				where: { id: existingItem.id },
				data: { amount: existingItem.amount + action.amount },
			})
		else
			await tx.shoppingListItem.create({
				data: {
					name: action.name,
					amount: action.amount,
					userId,
				},
			})
	}

	async handleUpdateAction(params: ShoppingListActionParams) {
		const { tx, userId, action } = params

		if (!action.amount || action.amount < 1)
			throw new Error('Amount must be at least 1 for update action')

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				userId,
				name: {
					equals: action.name,
					mode: 'insensitive',
				},
			},
		})

		if (!existingItem) throw new Error(`Item "${action.name}" not found`)

		await tx.shoppingListItem.update({
			where: { id: existingItem.id },
			data: { amount: action.amount },
		})
	}

	async handleDeleteAction(params: ShoppingListActionParams) {
		const { tx, userId, action } = params

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				userId,
				name: {
					equals: action.name,
					mode: 'insensitive',
				},
			},
		})

		if (!existingItem) throw new Error(`Item "${action.name}" not found`)

		await tx.shoppingListItem.delete({
			where: { id: existingItem.id },
		})
	}

	async handleCompleteAction(params: ShoppingListActionParams) {
		const { tx, userId, action } = params

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				userId,
				name: {
					equals: action.name,
					mode: 'insensitive',
				},
			},
		})

		if (!existingItem) throw new Error(`Item "${action.name}" not found`)

		await tx.shoppingListItem.update({
			where: { id: existingItem.id },
			data: { isCompleted: !existingItem.isCompleted },
		})
	}
}
