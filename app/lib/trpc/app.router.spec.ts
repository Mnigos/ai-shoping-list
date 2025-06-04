import { vi } from 'vitest'

// Mock the individual routers using vi.hoisted
const mockChatRouter = vi.hoisted(() => ({
	assistant: vi.fn(),
}))

const mockShoppingListRouter = vi.hoisted(() => ({
	getItems: vi.fn(),
	addItem: vi.fn(),
	updateItem: vi.fn(),
	deleteItem: vi.fn(),
	toggleComplete: vi.fn(),
	executeActions: vi.fn(),
}))

const mockCreateTRPCRouter = vi.hoisted(() =>
	vi.fn().mockImplementation(routes => routes),
)

vi.mock('~/modules/chat/server/chat.router', () => ({
	chatRouter: mockChatRouter,
}))

vi.mock('~/modules/shopping-list/server/shopping-list.router', () => ({
	shoppingListRouter: mockShoppingListRouter,
}))

vi.mock('./t', () => ({
	createTRPCRouter: mockCreateTRPCRouter,
}))

// Import after mocks are set up
import { appRouter } from './app.router'

describe('App Router', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should create router with correct routes', () => {
		// Test that the router was created with the expected structure
		// This is more reliable than tracking function calls during import
		expect(appRouter).toBeDefined()
		expect(appRouter).toHaveProperty('chat', mockChatRouter)
		expect(appRouter).toHaveProperty('shoppingList', mockShoppingListRouter)

		// Verify the router structure matches what we expect
		const routerKeys = Object.keys(appRouter)
		expect(routerKeys).toEqual(['chat', 'shoppingList'])
	})

	test('should have chat routes', () => {
		expect(appRouter).toHaveProperty('chat')
		expect(appRouter.chat).toBe(mockChatRouter)
	})

	test('should have shopping list routes', () => {
		expect(appRouter).toHaveProperty('shoppingList')
		expect(appRouter.shoppingList).toBe(mockShoppingListRouter)
	})

	test('should have all expected route namespaces', () => {
		const expectedNamespaces = ['chat', 'shoppingList']

		for (const namespace of expectedNamespaces) {
			expect(appRouter).toHaveProperty(namespace)
		}
	})

	test('should have chat assistant route', () => {
		expect(appRouter.chat).toHaveProperty('assistant')
		expect(typeof appRouter.chat.assistant).toBe('function')
	})

	test('should have all shopping list routes', () => {
		const expectedShoppingListRoutes = [
			'getItems',
			'addItem',
			'updateItem',
			'deleteItem',
			'toggleComplete',
			'executeActions',
		]

		for (const route of expectedShoppingListRoutes) {
			expect(appRouter.shoppingList).toHaveProperty(route)
		}
	})

	test('should be defined as an object', () => {
		expect(appRouter).toBeDefined()
		expect(typeof appRouter).toBe('object')
		expect(appRouter).not.toBeNull()
	})

	test('should have consistent structure', () => {
		// The router should be a flat object with namespace keys
		const keys = Object.keys(appRouter)
		expect(keys).toEqual(['chat', 'shoppingList'])

		// Each namespace should be an object
		for (const key of keys) {
			expect(typeof appRouter[key as keyof typeof appRouter]).toBe('object')
		}
	})
})
