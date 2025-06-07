import type { TRPCRouterRecord } from '@trpc/server'
import { shoppingListProcedure } from './shopping-list.procedure'
import {
	AddItemInputSchema,
	DeleteItemInputSchema,
	ExecuteActionsInputSchema,
	GetItemsInputSchema,
	ToggleCompleteInputSchema,
	UpdateItemInputSchema,
} from './shopping-list.service'

export const shoppingListRouter = {
	getItems: shoppingListProcedure
		.input(GetItemsInputSchema)
		.query(async ({ ctx, input }) => ctx.service.getItems(input)),

	executeActions: shoppingListProcedure
		.input(ExecuteActionsInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.executeActions(input)),

	addItem: shoppingListProcedure
		.input(AddItemInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.addItem(input)),

	updateItem: shoppingListProcedure
		.input(UpdateItemInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.updateItem(input)),

	toggleComplete: shoppingListProcedure
		.input(ToggleCompleteInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.toggleComplete(input)),

	deleteItem: shoppingListProcedure
		.input(DeleteItemInputSchema)
		.mutation(async ({ ctx, input }) => ctx.service.deleteItem(input)),
} satisfies TRPCRouterRecord
