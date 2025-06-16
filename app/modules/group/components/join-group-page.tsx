import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCurrentUserQuery } from '~/modules/auth/hooks/use-current-user.query'
import { Button } from '~/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/shared/components/ui/card'
import { useJoinGroupMutation } from '../hooks/mutations/use-join-group.mutation'
import { useValidateInviteCodeQuery } from '../hooks/queries/use-validate-invite-code.query'
import { GroupPreviewCard } from './group-preview.card'

interface JoinGroupPageProps {
	code: string
}

export function JoinGroupPage({ code }: JoinGroupPageProps) {
	const navigate = useNavigate()
	const { data: currentUser } = useCurrentUserQuery()
	const { data: validationResponse } = useValidateInviteCodeQuery(code)
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

	function handleAuthSuccess() {
		setShowAuthModal(false)
	}

	// Join group mutation
	const joinMutation = useJoinGroupMutation()

	const handleJoinGroup = async () => {
		try {
			// The mutation will handle navigation automatically
			await joinMutation.mutateAsync({ inviteCode: code })
		} catch (error) {
			console.error('Failed to join group:', error)
			// Error will be handled by the mutation error state
		}
	}

	// Error state for invalid token
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
