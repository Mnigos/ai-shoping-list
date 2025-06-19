import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'
import { useNavigate } from 'react-router'
import { SignInModal } from '~/shared/components/auth/sign-in.modal'
import { SignUpModal } from '~/shared/components/auth/sign-up.modal'
import { Button } from '~/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import { useCanPerformGroupActions } from '~/shared/hooks/use-auth-status'
import { useJoinGroupMutation } from '../../hooks/mutations/use-join-group.mutation'
import { useValidateInviteCodeQuery } from '../../hooks/queries/use-validate-invite-code.query'
import { GroupPreviewCard } from '../group-preview.card'

interface InvitePageProps {
	code: string
}

export function InvitePage({ code }: Readonly<InvitePageProps>) {
	const navigate = useNavigate()
	const canPerformGroupActions = useCanPerformGroupActions()
	const { data: validationResponse } = useValidateInviteCodeQuery(code)
	const joinMutation = useJoinGroupMutation()

	// Use current URL as callback so user returns to invite page after auth
	const currentUrl = typeof window !== 'undefined' ? window.location.href : '/'

	async function handleJoinGroup() {
		try {
			await joinMutation.mutateAsync({ inviteCode: code })
		} catch (error) {
			console.error('Failed to join group:', error)
		}
	}

	async function handleAuthSuccess() {
		// After successful auth, automatically join the group
		try {
			await joinMutation.mutateAsync({ inviteCode: code })
		} catch (error) {
			console.error('Failed to join group after authentication:', error)
		}
	}

	if (joinMutation.isError || !validationResponse) {
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

	const { group } = validationResponse

	return (
		<div className="container mx-auto flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						{group.isMember ? "You're Already a Member" : 'Join Group'}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<GroupPreviewCard group={group} />

					{group.isMember ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-5 w-5" />
								<span className="font-medium">
									You're already a member of this group
								</span>
							</div>
							<Button
								onClick={() => {
									navigate(`/groups/${group.id}`)
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

							{canPerformGroupActions ? (
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
							) : (
								<div className="space-y-3">
									<p className="text-center text-muted-foreground text-sm">
										Please sign in or create an account to join this group
									</p>
									<div className="flex gap-2">
										<SignInModal
											onSuccess={handleAuthSuccess}
											callbackURL={currentUrl}
										>
											<Button variant="outline" className="flex-1">
												Sign In
											</Button>
										</SignInModal>
										<SignUpModal
											onSuccess={handleAuthSuccess}
											callbackURL={currentUrl}
										>
											<Button className="flex-1">Sign Up</Button>
										</SignUpModal>
									</div>
								</div>
							)}
						</div>
					)}

					<div className="text-center">
						<Button variant="ghost" onClick={() => navigate('/groups')}>
							Cancel
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
