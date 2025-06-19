import { useState, useTransition } from 'react'
import type { PropsWithChildren } from 'react'
import { z } from 'zod'
import { Button } from '~/shared/components/ui/button'
import { useAppForm } from '~/shared/components/ui/form'
import { Input } from '~/shared/components/ui/input'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { useJoinGroupMutation } from '../../hooks/mutations/use-join-group.mutation'

interface JoinGroupDialogProps extends PropsWithChildren {
	onGroupJoined?: (groupId: string) => void
}

export function JoinGroupDialog({
	children,
	onGroupJoined,
}: Readonly<JoinGroupDialogProps>) {
	const [open, setOpen] = useState(false)
	const [isLoading, startTransition] = useTransition()
	const joinGroupMutation = useJoinGroupMutation()

	const form = useAppForm({
		defaultValues: {
			inviteCode: '',
		},
		onSubmit: async ({ value }) => {
			joinGroupMutation.mutate(value, {
				onSuccess: data => {
					setOpen(false)
					onGroupJoined?.(data.groupId)
				},
			})
		},
	})

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		event.stopPropagation()
		startTransition(async () => {
			await form.handleSubmit()
		})
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Join Group"
			description="Enter an invite code to join an existing group."
		>
			<ModalTrigger>{children}</ModalTrigger>

			<form.AppForm>
				<form onSubmit={handleSubmit} className="space-y-4">
					<form.AppField
						name="inviteCode"
						validators={{
							onBlur: z
								.string()
								.min(1, 'Invite code is required')
								.regex(
									/^[A-Z0-9]{6}$/,
									'Invite code must be 6 characters (letters and numbers)',
								),
						}}
					>
						{field => (
							<field.FormItem>
								<field.FormLabel>Invite Code</field.FormLabel>
								<field.FormControl>
									<Input
										type="text"
										placeholder="Enter 6-character code"
										value={field.state.value}
										onChange={({ target }) => {
											const upperValue = target.value.toUpperCase()
											field.handleChange(upperValue)
										}}
										onBlur={field.handleBlur}
										maxLength={6}
										className="text-center font-mono text-lg tracking-widest"
									/>
								</field.FormControl>
								<field.FormMessage />
							</field.FormItem>
						)}
					</form.AppField>

					<div className="text-muted-foreground text-sm">
						<p>
							Don't have an invite code? Ask a group member to share one with
							you.
						</p>
					</div>

					<ModalFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading || joinGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || joinGroupMutation.isPending}
						>
							{isLoading || joinGroupMutation.isPending
								? 'Joining...'
								: 'Join Group'}
						</Button>
					</ModalFooter>
				</form>
			</form.AppForm>
		</Modal>
	)
}
