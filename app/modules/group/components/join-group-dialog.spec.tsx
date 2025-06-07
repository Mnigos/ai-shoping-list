import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InviteCodeValidationResult } from '../server/group-invite.service'
import { JoinGroupDialog } from './join-group-dialog'

// Mock the hooks
vi.mock('../hooks/use-join-group-mutation', () => ({
	useJoinGroupMutation: vi.fn(),
	useValidateInviteCodeQuery: vi.fn(),
}))

vi.mock('~/shared/hooks/use-auth-status', () => ({
	useCanPerformGroupActions: vi.fn(() => true),
}))

const mockValidGroupInfo: InviteCodeValidationResult = {
	id: 'group-1',
	name: 'Test Group',
	description: 'A test group',
	createdAt: new Date('2024-01-15T10:00:00Z'),
	memberCount: 3,
	itemCount: 5,
	isAlreadyMember: false,
}

const mockAlreadyMemberGroupInfo: InviteCodeValidationResult = {
	...mockValidGroupInfo,
	isAlreadyMember: true,
}

function renderWithQueryClient(component: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})

	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	)
}

describe('JoinGroupDialog', () => {
	const mockJoinGroupMutation = {
		mutate: vi.fn(),
		isPending: false,
		isError: false,
		error: null,
	}

	const mockValidationQuery = {
		data: null,
		isSuccess: false,
		isError: false,
		isFetching: false,
		error: null,
	}

	beforeEach(() => {
		vi.clearAllMocks()

		const {
			useJoinGroupMutation,
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')
		useJoinGroupMutation.mockReturnValue(mockJoinGroupMutation)
		useValidateInviteCodeQuery.mockReturnValue(mockValidationQuery)
	})

	it('renders trigger and opens dialog', async () => {
		const user = userEvent.setup()

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		const trigger = screen.getByText('Join Group')
		expect(trigger).toBeInTheDocument()

		await user.click(trigger)

		expect(
			screen.getByText(
				'Enter the invite code shared by a group member to join their group.',
			),
		).toBeInTheDocument()
		expect(screen.getByLabelText('Invite Code')).toBeInTheDocument()
	})

	it('validates invite code on blur', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'ABC123')
		await user.tab() // Trigger blur

		await waitFor(() => {
			expect(useValidateInviteCodeQuery).toHaveBeenCalledWith('ABC123')
		})
	})

	it('shows loading state during validation', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isFetching: true,
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'ABC123')
		await user.tab()

		expect(screen.getByTestId('lucide-loader-2')).toBeInTheDocument()
	})

	it('shows validation error', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isError: true,
			error: { message: 'Invalid invite code' },
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'INVALID')
		await user.tab()

		await waitFor(() => {
			expect(screen.getByText('Invalid invite code')).toBeInTheDocument()
		})
		expect(screen.getByTestId('lucide-alert-circle')).toBeInTheDocument()
	})

	it('shows group preview for valid code', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockValidGroupInfo,
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'VALID123')
		await user.tab()

		await waitFor(() => {
			expect(screen.getByText('Group Preview')).toBeInTheDocument()
			expect(screen.getByText('Test Group')).toBeInTheDocument()
		})
		expect(screen.getByTestId('lucide-check-circle-2')).toBeInTheDocument()
	})

	it('shows already member message', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockAlreadyMemberGroupInfo,
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'MEMBER123')
		await user.tab()

		await waitFor(() => {
			expect(
				screen.getByText('You are already a member of this group'),
			).toBeInTheDocument()
		})
	})

	it('enables join button for valid non-member group', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockValidGroupInfo,
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'VALID123')
		await user.tab()

		await waitFor(() => {
			const joinButton = screen.getByRole('button', { name: 'Join Group' })
			expect(joinButton).toBeEnabled()
		})
	})

	it('calls join mutation on form submit', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
		} = require('../hooks/use-join-group-mutation')
		const onGroupJoined = vi.fn()

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockValidGroupInfo,
		})

		renderWithQueryClient(
			<JoinGroupDialog onGroupJoined={onGroupJoined}>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'VALID123')
		await user.tab()

		await waitFor(() => {
			const joinButton = screen.getByRole('button', { name: 'Join Group' })
			expect(joinButton).toBeEnabled()
		})

		const joinButton = screen.getByRole('button', { name: 'Join Group' })
		await user.click(joinButton)

		expect(mockJoinGroupMutation.mutate).toHaveBeenCalledWith(
			{ inviteCode: 'VALID123' },
			expect.any(Object),
		)
	})

	it('shows join error message', async () => {
		const user = userEvent.setup()
		const {
			useValidateInviteCodeQuery,
			useJoinGroupMutation,
		} = require('../hooks/use-join-group-mutation')

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockValidGroupInfo,
		})

		useJoinGroupMutation.mockReturnValue({
			...mockJoinGroupMutation,
			isError: true,
			error: { message: 'Failed to join group' },
		})

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		await waitFor(() => {
			expect(screen.getByText('Failed to join group')).toBeInTheDocument()
		})
	})

	it('resets form when dialog closes', async () => {
		const user = userEvent.setup()

		renderWithQueryClient(
			<JoinGroupDialog>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'TEST123')

		const cancelButton = screen.getByRole('button', { name: 'Cancel' })
		await user.click(cancelButton)

		// Reopen dialog
		await user.click(screen.getByText('Join Group'))

		const newInput = screen.getByLabelText('Invite Code')
		expect(newInput).toHaveValue('')
	})

	it('calls onGroupJoined callback on successful join', async () => {
		const user = userEvent.setup()
		const onGroupJoined = vi.fn()
		const {
			useValidateInviteCodeQuery,
			useJoinGroupMutation,
		} = require('../hooks/use-join-group-mutation')

		const mockMutate = vi.fn((input, options) => {
			options.onSuccess({ id: 'group-1', name: 'Test Group' })
		})

		useValidateInviteCodeQuery.mockReturnValue({
			...mockValidationQuery,
			isSuccess: true,
			data: mockValidGroupInfo,
		})

		useJoinGroupMutation.mockReturnValue({
			...mockJoinGroupMutation,
			mutate: mockMutate,
		})

		renderWithQueryClient(
			<JoinGroupDialog onGroupJoined={onGroupJoined}>
				<button type="button">Join Group</button>
			</JoinGroupDialog>,
		)

		await user.click(screen.getByText('Join Group'))

		const input = screen.getByLabelText('Invite Code')
		await user.type(input, 'VALID123')
		await user.tab()

		await waitFor(() => {
			const joinButton = screen.getByRole('button', { name: 'Join Group' })
			expect(joinButton).toBeEnabled()
		})

		const joinButton = screen.getByRole('button', { name: 'Join Group' })
		await user.click(joinButton)

		expect(onGroupJoined).toHaveBeenCalledWith({
			id: 'group-1',
			name: 'Test Group',
		})
	})
})
