import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { SignInModal } from '~/shared/components/auth/sign-in-modal'
import { SignUpModal } from '~/shared/components/auth/sign-up-modal'
import { Button } from '~/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import { useAuthStatus } from '~/shared/hooks/use-auth-status'
import { useJoinGroupMutation } from '../hooks/use-join-group.mutation'
import { GroupPreview } from './group-preview'

interface JoinGroupPageProps {
	code: string
}

export function JoinGroupPage({ code }: JoinGroupPageProps) {
	const navigate = useNavigate()
	const {
		isAuthenticated,
		isAnonymous,
		isLoading: authLoading,
	} = useAuthStatus()
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

	// Join group mutation
	const joinMutation = useJoinGroupMutation()

	// Handle authentication requirement
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			setShowAuthModal(true)
		}
	}, [authLoading, isAuthenticated])

	const handleJoinGroup = async () => {
		try {
			// The mutation will handle navigation automatically
			await joinMutation.mutateAsync({ inviteCode: code })
		} catch (error) {
			console.error('Failed to join group:', error)
			// Error will be handled by the mutation error state
		}
	}

	const handleAuthSuccess = () => {
		setShowAuthModal(false)
		// The component will re-render with authenticated state
	}

	// Loading state while checking auth or validating token
	if (authLoading) {
		return (
			<div className="container mx-auto flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center gap-4 p-6">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground">
							{authLoading
								? 'Checking authentication...'
								: 'Validating invite...'}
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Error state for invalid token
	if (joinMutation.isError) {
		return (
			<div className="container mx-auto flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-destructive">
							<AlertCircle className="h-5 w-5" />
							Invalid Invite Link
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">
							This invite link is invalid or has expired. Please ask the group
							admin for a new invite link.
						</p>
						<Button onClick={() => navigate('/')} className="w-full">
							Go to Home
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Show authentication modal for anonymous users
	if (!isAuthenticated || isAnonymous) {
		return (
			<>
				<div className="container mx-auto flex min-h-screen items-center justify-center p-4">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Join Group
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="text-center">
								<p className="mb-4 text-muted-foreground">
									You need to sign in to join this group.
								</p>
								<Button
									onClick={() => setShowAuthModal(true)}
									className="w-full"
								>
									Sign In to Join
								</Button>
								<div className="mt-2">
									<button
										type="button"
										onClick={() => {
											setAuthMode('signup')
											setShowAuthModal(true)
										}}
										className="text-primary text-sm hover:underline"
									>
										Don't have an account? Sign up
									</button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{authMode === 'signin' ? (
					<SignInModal isOpen={showAuthModal} onClose={handleAuthSuccess} />
				) : (
					<SignUpModal isOpen={showAuthModal} onClose={handleAuthSuccess} />
				)}
			</>
		)
	}

	return (
		<div className="container mx-auto flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						{groupInfo.isAlreadyMember
							? "You're Already a Member"
							: 'Join Group'}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<GroupPreview groupInfo={groupInfo} />

					{groupInfo.isAlreadyMember ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-5 w-5" />
								<span className="font-medium">
									You're already a member of this group
								</span>
							</div>
							<Button
								onClick={() => {
									setActiveGroup(groupInfo.id)
									navigate('/')
								}}
								className="w-full"
							>
								Go to Group
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								You'll be able to view and edit the shared shopping list with
								other group members.
							</p>
							<Button
								onClick={handleJoinGroup}
								disabled={joinMutation.isPending}
								className="w-full"
							>
								{joinMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Joining...
									</>
								) : (
									'Join Group'
								)}
							</Button>
						</div>
					)}

					{/* Error message for join operation */}
					{joinMutation.isError && (
						<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
							<p className="text-destructive text-sm">
								{joinMutation.error?.message ||
									'Failed to join group. Please try again.'}
							</p>
						</div>
					)}

					<div className="text-center">
						<Button variant="ghost" onClick={() => navigate('/')}>
							Cancel
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
