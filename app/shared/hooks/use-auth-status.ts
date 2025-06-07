import { authClient } from '~/lib/auth-client'

export interface AuthStatus {
	isAuthenticated: boolean
	isAnonymous: boolean
	isLoading: boolean
	user: {
		id: string
		name: string
		email: string
		emailVerified: boolean
		createdAt: Date
		updatedAt: Date
		image?: string | null
		isAnonymous?: boolean | null
	} | null
}

/**
 * Hook to detect anonymous users and provide authentication status
 *
 * @returns AuthStatus object with authentication information
 */
export function useAuthStatus(): AuthStatus {
	const { data: session, isPending } = authClient.useSession()

	const isAuthenticated = !!session?.user
	const isAnonymous = session?.user?.isAnonymous ?? false
	const isLoading = isPending

	return {
		isAuthenticated,
		isAnonymous,
		isLoading,
		user: session?.user ?? null,
	}
}

/**
 * Hook to check if the current user can perform group actions
 * Anonymous users cannot create or join groups
 *
 * @returns boolean indicating if user can perform group actions
 */
export function useCanPerformGroupActions(): boolean {
	const { isAuthenticated, isAnonymous } = useAuthStatus()
	return isAuthenticated && !isAnonymous
}
