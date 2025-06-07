import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { AnonymousUserGuard } from '~/shared/components/auth/anonymous-user-guard'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/shared/components/ui/dialog'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import {
	useJoinGroupMutation,
	useValidateInviteCodeQuery,
} from '../hooks/use-join-group-mutation'
import { GroupPreview } from './group-preview'

interface JoinGroupDialogProps {
	children: React.ReactNode
	onGroupJoined?: (group: { id: string; name: string }) => void
}

export function JoinGroupDialog({
	children,
	onGroupJoined,
}: JoinGroupDialogProps) {
	const [open, setOpen] = useState(false)
	const [inviteCode, setInviteCode] = useState('')
	const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false)

	const joinGroupMutation = useJoinGroupMutation()

	// Only validate when user has typed something and stopped typing
	const shouldValidate = inviteCode.trim().length > 0 && hasAttemptedValidation
	const validationQuery = useValidateInviteCodeQuery(
		shouldValidate ? inviteCode.trim() : null,
	)

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()

		const trimmedCode = inviteCode.trim()
		if (!trimmedCode) return

		// If we haven't validated yet, trigger validation first
		if (!hasAttemptedValidation) {
			setHasAttemptedValidation(true)
			return
		}

		// If validation failed, don't proceed
		if (validationQuery.isError) return

		joinGroupMutation.mutate(
			{ inviteCode: trimmedCode },
			{
				onSuccess: group => {
					setOpen(false)
					setInviteCode('')
					setHasAttemptedValidation(false)
					onGroupJoined?.(group)
				},
			},
		)
	}

	function handleInputChange(value: string) {
		setInviteCode(value)
		// Reset validation state when user types
		if (hasAttemptedValidation && value.trim() !== inviteCode.trim()) {
			setHasAttemptedValidation(false)
		}
	}

	function handleInputBlur() {
		if (inviteCode.trim().length > 0) {
			setHasAttemptedValidation(true)
		}
	}

	function handleDialogChange(newOpen: boolean) {
		setOpen(newOpen)
		if (!newOpen) {
			// Reset form when dialog closes
			setInviteCode('')
			setHasAttemptedValidation(false)
		}
	}

	const trimmedCode = inviteCode.trim()
	const isValidating = shouldValidate && validationQuery.isFetching
	const hasValidationError = shouldValidate && validationQuery.isError
	const hasValidGroup =
		shouldValidate && validationQuery.isSuccess && validationQuery.data
	const isAlreadyMember = hasValidGroup && validationQuery.data?.isAlreadyMember

	const canSubmit = trimmedCode.length > 0 && hasValidGroup && !isAlreadyMember
	const isLoading = joinGroupMutation.isPending || isValidating

	return (
		<AnonymousUserGuard tooltipContent="Please sign up to join groups">
			<Dialog open={open} onOpenChange={handleDialogChange}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Join Group</DialogTitle>
						<DialogDescription>
							Enter the invite code shared by a group member to join their
							group.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="invite-code">Invite Code</Label>
							<div className="relative">
								<Input
									id="invite-code"
									type="text"
									placeholder="Enter invite code"
									value={inviteCode}
									onChange={e => handleInputChange(e.target.value)}
									onBlur={handleInputBlur}
									className={`pr-10 ${
										hasValidationError
											? 'border-destructive focus-visible:ring-destructive'
											: hasValidGroup
												? 'border-green-500 focus-visible:ring-green-500'
												: ''
									}`}
									disabled={isLoading}
									autoComplete="off"
								/>
								<div className="-translate-y-1/2 absolute top-1/2 right-3">
									{isValidating && (
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									)}
									{hasValidationError && (
										<AlertCircle className="h-4 w-4 text-destructive" />
									)}
									{hasValidGroup && !isAlreadyMember && (
										<CheckCircle2 className="h-4 w-4 text-green-500" />
									)}
								</div>
							</div>

							{/* Validation feedback */}
							{hasValidationError && (
								<p className="text-destructive text-sm">
									{validationQuery.error?.message || 'Invalid invite code'}
								</p>
							)}
							{isAlreadyMember && (
								<p className="text-amber-600 text-sm">
									You are already a member of this group
								</p>
							)}
						</div>

						{/* Group preview */}
						{hasValidGroup && !isAlreadyMember && (
							<div className="space-y-2">
								<Label>Group Preview</Label>
								<GroupPreview groupInfo={validationQuery.data} />
							</div>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={!canSubmit || isLoading}>
								{joinGroupMutation.isPending
									? 'Joining...'
									: hasAttemptedValidation && hasValidGroup
										? 'Join Group'
										: 'Validate Code'}
							</Button>
						</DialogFooter>
					</form>

					{/* Error message for join operation */}
					{joinGroupMutation.isError && (
						<div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
							<p className="text-destructive text-sm">
								{joinGroupMutation.error?.message || 'Failed to join group'}
							</p>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</AnonymousUserGuard>
	)
}
