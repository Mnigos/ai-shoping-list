import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import type { PrismaTransaction } from '~/shared/types/prisma'

export const ShoppingListActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('add'),
		name: z.string(),
		amount: z.number().min(1, 'Amount must be at least 1'),
	}),
	z.object({
		action: z.literal('update'),
		name: z.string(),
		amount: z.number().min(1, 'Amount must be at least 1'),
	}),
	z.object({
		action: z.literal('delete'),
		name: z.string(),
	}),
	z.object({
		action: z.literal('complete'),
		name: z.string(),
	}),
])
export type ShoppingListActionSchema = z.infer<typeof ShoppingListActionSchema>

interface ShoppingListActionParams {
	tx: PrismaTransaction
	userId: string
	groupId: string
	action: ShoppingListActionSchema
}

export class ShoppingListActionsService {
	constructor(private readonly ctx: ProtectedContext) {}

	execute(
		actions: z.infer<typeof ShoppingListActionSchema>[],
		groupId: string,
	) {
		const userId = this.ctx.user.id

		return this.ctx.prisma.$transaction(async tx => {
			for (const action of actions)
				switch (action.action) {
					case 'add':
						await this.handleAddAction({ tx, userId, groupId, action })
						break
					case 'update':
						await this.handleUpdateAction({ tx, userId, groupId, action })
						break
					case 'delete':
						await this.handleDeleteAction({ tx, userId, groupId, action })
						break
					case 'complete':
						await this.handleCompleteAction({ tx, userId, groupId, action })
						break
				}

			return tx.shoppingListItem.findMany({
				where: { groupId },
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			})
		})
	}

	async handleAddAction(params: ShoppingListActionParams) {
		const { tx, userId, groupId, action } = params

		if (action.action !== 'add') {
			throw new Error('Invalid action type for handleAddAction')
		}

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				groupId,
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
					groupId,
					createdById: userId,
				},
			})
	}

	async handleUpdateAction(params: ShoppingListActionParams) {
		const { tx, groupId, action } = params

		if (action.action !== 'update') {
			throw new Error('Invalid action type for handleUpdateAction')
		}

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				groupId,
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
		const { tx, groupId, action } = params

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				groupId,
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
		const { tx, groupId, action } = params

		const existingItem = await tx.shoppingListItem.findFirst({
			where: {
				groupId,
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
