import { TRPCError } from '@trpc/server'
import z from 'zod'
import type { ProtectedContext } from '~/lib/trpc/t'
import {
	ShoppingListActionSchema,
	ShoppingListActionsService,
} from './shopping-list-action.service'

export const ExecuteActionsInputSchema = z.object({
	actions: z.array(ShoppingListActionSchema),
})
export type ExecuteActionsInput = z.infer<typeof ExecuteActionsInputSchema>

export const AddItemInputSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	amount: z.number().min(1, 'Amount must be at least 1').default(1),
})
export type AddItemInput = z.infer<typeof AddItemInputSchema>

export const UpdateItemInputSchema = z.object({
	id: z.string(),
	amount: z.number().min(1, 'Amount must be at least 1'),
})
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>

export const ToggleCompleteInputSchema = z.object({
	id: z.string(),
})
export type ToggleCompleteInput = z.infer<typeof ToggleCompleteInputSchema>

export const DeleteItemInputSchema = z.object({
	id: z.string(),
})
export type DeleteItemInput = z.infer<typeof DeleteItemInputSchema>

export class ShoppingListService {
	private readonly actionsService: ShoppingListActionsService

	constructor(private readonly ctx: ProtectedContext) {
		this.actionsService = new ShoppingListActionsService(ctx)
	}

	async getItems() {
		return this.ctx.prisma.shoppingListItem.findMany({
			where: { userId: this.ctx.user.id },
			orderBy: { createdAt: 'desc' },
		})
	}

	async executeActions(input: ExecuteActionsInput) {
		return this.actionsService.execute(input.actions)
	}

	async addItem(input: AddItemInput) {
		try {
			return this.ctx.prisma.shoppingListItem.create({
				data: {
					name: input.name,
					amount: input.amount,
					userId: this.ctx.user.id,
				},
			})
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'P2002')
				throw new TRPCError({
					code: 'CONFLICT',
					message: `Item "${input.name}" already exists in your shopping list`,
				})

			throw error
		}
	}

	async updateItem(input: UpdateItemInput) {
		return this.ctx.prisma.shoppingListItem.update({
			where: { id: input.id, userId: this.ctx.user.id },
			data: { amount: input.amount },
		})
	}

	async toggleComplete(input: ToggleCompleteInput) {
		const item = await this.ctx.prisma.shoppingListItem.findUnique({
			where: { id: input.id, userId: this.ctx.user.id },
		})

		if (!item)
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' })

		return this.ctx.prisma.shoppingListItem.update({
			where: { id: input.id, userId: this.ctx.user.id },
			data: { isCompleted: !item.isCompleted },
		})
	}

	async deleteItem(input: DeleteItemInput) {
		return this.ctx.prisma.shoppingListItem.delete({
			where: { id: input.id, userId: this.ctx.user.id },
		})
	}
}
