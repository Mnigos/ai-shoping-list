import { type PropsWithChildren, useState, useTransition } from 'react'
import { z } from 'zod'
import { Button } from '~/shared/components/ui/button'
import { useAppForm } from '~/shared/components/ui/form'
import { Input } from '~/shared/components/ui/input'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { Textarea } from '~/shared/components/ui/textarea'
import { useCreateGroupMutation } from '../../hooks/mutations/use-create-group.mutation'

interface CreateGroupDialogProps extends PropsWithChildren {
	onGroupCreated?: (group: { id: string; name: string }) => void
}

export function CreateGroupDialog({
	children,
	onGroupCreated,
}: Readonly<CreateGroupDialogProps>) {
	const [open, setOpen] = useState(false)
	const [isLoading, startTransition] = useTransition()
	const createGroupMutation = useCreateGroupMutation()

	const form = useAppForm({
		defaultValues: {
			name: '',
			description: '',
		},
		onSubmit: async ({ value }) => {
			createGroupMutation.mutate(value, {
				onSuccess: group => {
					setOpen(false)
					onGroupCreated?.(group)
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
			title="Create New Group"
			description="Create a group to share shopping lists with family and friends."
		>
			<ModalTrigger>{children}</ModalTrigger>

			<form.AppForm>
				<form onSubmit={handleSubmit} className="space-y-4">
					<form.AppField
						name="name"
						validators={{
							onBlur: z
								.string()
								.min(1, 'Name is required')
								.max(50, 'Name must be 50 characters or less'),
						}}
					>
						{field => (
							<field.FormItem>
								<field.FormLabel>Group Name</field.FormLabel>
								<field.FormControl>
									<Input
										type="text"
										placeholder="e.g., Family, Roommates, Work Team"
										value={field.state.value}
										onChange={({ target }) => field.handleChange(target.value)}
										onBlur={field.handleBlur}
										maxLength={50}
									/>
								</field.FormControl>
								<field.FormMessage />
							</field.FormItem>
						)}
					</form.AppField>

					<form.AppField
						name="description"
						validators={{
							onBlur: z
								.string()
								.max(200, 'Description must be 200 characters or less'),
						}}
					>
						{field => (
							<field.FormItem>
								<field.FormLabel>Description (Optional)</field.FormLabel>
								<field.FormControl>
									<Textarea
										placeholder="What's this group for?"
										value={field.state.value}
										onChange={({ target }) => field.handleChange(target.value)}
										onBlur={field.handleBlur}
										maxLength={200}
										rows={3}
									/>
								</field.FormControl>
								<field.FormMessage />
							</field.FormItem>
						)}
					</form.AppField>

					<ModalFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isLoading || createGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || createGroupMutation.isPending}
						>
							{isLoading || createGroupMutation.isPending
								? 'Creating...'
								: 'Create Group'}
						</Button>
					</ModalFooter>
				</form>
			</form.AppForm>
		</Modal>
	)
}
