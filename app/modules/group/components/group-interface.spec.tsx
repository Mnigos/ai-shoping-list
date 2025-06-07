import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CompactGroupInterface, GroupInterface } from './group-interface'

// Mock the hooks
vi.mock('../hooks/use-active-group', () => ({
	useActiveGroupData: vi.fn(),
}))

vi.mock('~/shared/components/auth/anonymous-user-guard', () => ({
	AnonymousUserGuard: ({ children, fallback }: any) => {
		// For testing, we'll just return children or fallback based on a mock condition
		return children || fallback
	},
}))

vi.mock('./create-group-dialog', () => ({
	CreateGroupDialog: ({ children }: any) => (
		<div data-testid="create-group-dialog">{children}</div>
	),
}))

vi.mock('./group-selector', () => ({
	GroupSelector: () => <div data-testid="group-selector">Group Selector</div>,
}))

const { useActiveGroupData } = await import('../hooks/use-active-group')

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

describe('GroupInterface', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('shows loading state when data is loading', () => {
		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: false,
			isLoading: true,
			activeGroup: null,
			activeGroupId: null,
			setActiveGroup: vi.fn(),
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: '',
			availableGroups: [],
		})

		renderWithQueryClient(<GroupInterface />)

		expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
	})

	it('shows create group button for users with only personal groups', () => {
		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: false,
			isLoading: false,
			activeGroup: null,
			activeGroupId: null,
			setActiveGroup: vi.fn(),
			isPersonalGroup: true,
			canManageGroup: false,
			groupName: '',
			availableGroups: [],
		})

		renderWithQueryClient(<GroupInterface />)

		expect(screen.getByText('Create Group')).toBeInTheDocument()
		expect(screen.getByTestId('create-group-dialog')).toBeInTheDocument()
	})

	it('shows group selector for users with multiple groups', () => {
		const mockGroup = {
			id: '1',
			name: 'Test Group',
			description: null,
			inviteCode: 'test-code',
			isPersonal: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'MEMBER' as const,
		}
		const mockPersonalGroup = {
			id: '2',
			name: 'Personal',
			description: null,
			inviteCode: 'personal-code',
			isPersonal: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'ADMIN' as const,
		}

		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: true,
			isLoading: false,
			activeGroup: mockGroup,
			activeGroupId: '1',
			setActiveGroup: vi.fn(),
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: 'Test Group',
			availableGroups: [mockGroup, mockPersonalGroup],
		})

		renderWithQueryClient(<GroupInterface />)

		expect(screen.getByTestId('group-selector')).toBeInTheDocument()
	})
})

describe('CompactGroupInterface', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('shows compact create group button for users with only personal groups', () => {
		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: false,
			isLoading: false,
			activeGroup: null,
			activeGroupId: null,
			setActiveGroup: vi.fn(),
			isPersonalGroup: true,
			canManageGroup: false,
			groupName: '',
			availableGroups: [],
		})

		renderWithQueryClient(<CompactGroupInterface />)

		expect(screen.getByTestId('create-group-dialog')).toBeInTheDocument()
		// Should show just the plus icon, not the text
		expect(screen.queryByText('Create Group')).not.toBeInTheDocument()
	})

	it('shows compact group selector for users with multiple groups', () => {
		const mockGroup = {
			id: '1',
			name: 'Test Group',
			description: null,
			inviteCode: 'test-code',
			isPersonal: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'MEMBER' as const,
		}
		const mockPersonalGroup = {
			id: '2',
			name: 'Personal',
			description: null,
			inviteCode: 'personal-code',
			isPersonal: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			myRole: 'ADMIN' as const,
		}

		vi.mocked(useActiveGroupData).mockReturnValue({
			shouldShowGroupInterface: true,
			isLoading: false,
			activeGroup: mockGroup,
			activeGroupId: '1',
			setActiveGroup: vi.fn(),
			isPersonalGroup: false,
			canManageGroup: false,
			groupName: 'Test Group',
			availableGroups: [mockGroup, mockPersonalGroup],
		})

		renderWithQueryClient(<CompactGroupInterface />)

		expect(screen.getByTestId('group-selector')).toBeInTheDocument()
	})
})
