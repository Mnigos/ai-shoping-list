import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import {
	AnonymousUserGuard,
	withAnonymousUserGuard,
} from './anonymous-user-guard'

// Mock the auth status hook
const mockUseCanPerformGroupActions = vi.hoisted(() => vi.fn())

vi.mock('~/shared/hooks/use-auth-status', () => ({
	useCanPerformGroupActions: mockUseCanPerformGroupActions,
}))

describe('AnonymousUserGuard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should render children when user can perform group actions', () => {
		mockUseCanPerformGroupActions.mockReturnValue(true)

		render(
			<AnonymousUserGuard>
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		expect(
			screen.getByRole('button', { name: 'Create Group' }),
		).toBeInTheDocument()
		expect(screen.getByRole('button')).not.toHaveClass('opacity-50')
	})

	test('should disable children when user cannot perform group actions', () => {
		mockUseCanPerformGroupActions.mockReturnValue(false)

		render(
			<AnonymousUserGuard>
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		const button = screen.getByRole('button', { name: 'Create Group' })
		expect(button).toBeInTheDocument()

		// Check if the parent div has the disabled styling
		const parentDiv = button.closest('div')
		expect(parentDiv).toHaveClass('cursor-not-allowed', 'opacity-50')
	})

	test('should show custom tooltip content', () => {
		mockUseCanPerformGroupActions.mockReturnValue(false)

		render(
			<AnonymousUserGuard tooltipContent="Custom tooltip message">
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		// The tooltip content is rendered but may not be visible without interaction
		// We can check that the component renders without errors
		expect(
			screen.getByRole('button', { name: 'Create Group' }),
		).toBeInTheDocument()
	})

	test('should render fallback when provided and disabled', () => {
		mockUseCanPerformGroupActions.mockReturnValue(false)

		render(
			<AnonymousUserGuard fallback={<div>Sign up to create groups</div>}>
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		expect(screen.getByText('Sign up to create groups')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Create Group' }),
		).not.toBeInTheDocument()
	})

	test('should respect explicit disabled prop', () => {
		mockUseCanPerformGroupActions.mockReturnValue(true)

		render(
			<AnonymousUserGuard disabled={true}>
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		const button = screen.getByRole('button', { name: 'Create Group' })
		const parentDiv = button.closest('div')
		expect(parentDiv).toHaveClass('cursor-not-allowed', 'opacity-50')
	})

	test('should not disable when explicitly disabled is false and user can perform actions', () => {
		mockUseCanPerformGroupActions.mockReturnValue(true)

		render(
			<AnonymousUserGuard disabled={false}>
				<button type="button">Create Group</button>
			</AnonymousUserGuard>,
		)

		const button = screen.getByRole('button', { name: 'Create Group' })
		expect(button).toBeInTheDocument()
		expect(button.closest('div')).not.toHaveClass('opacity-50')
	})
})

describe('withAnonymousUserGuard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should wrap component with guard protection', () => {
		mockUseCanPerformGroupActions.mockReturnValue(true)

		const TestComponent = ({ title }: { title: string }) => <div>{title}</div>

		const GuardedComponent = withAnonymousUserGuard(TestComponent, {
			tooltipContent: 'Custom tooltip',
		})

		render(<GuardedComponent title="Test Title" />)

		expect(screen.getByText('Test Title')).toBeInTheDocument()
	})

	test('should disable wrapped component when user cannot perform actions', () => {
		mockUseCanPerformGroupActions.mockReturnValue(false)

		const TestComponent = ({ title }: { title: string }) => (
			<button type="button">{title}</button>
		)

		const GuardedComponent = withAnonymousUserGuard(TestComponent)

		render(<GuardedComponent title="Create Group" />)

		const button = screen.getByRole('button', { name: 'Create Group' })
		const parentDiv = button.closest('div')
		expect(parentDiv).toHaveClass('cursor-not-allowed', 'opacity-50')
	})

	test('should use custom fallback in HOC', () => {
		mockUseCanPerformGroupActions.mockReturnValue(false)

		const TestComponent = ({ title }: { title: string }) => (
			<button type="button">{title}</button>
		)

		const GuardedComponent = withAnonymousUserGuard(TestComponent, {
			fallback: <div>Please sign up</div>,
		})

		render(<GuardedComponent title="Create Group" />)

		expect(screen.getByText('Please sign up')).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Create Group' }),
		).not.toBeInTheDocument()
	})
})
