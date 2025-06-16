import { useTransition } from 'react'
import { type PropsWithChildren, useState } from 'react'
import { z } from 'zod'
import { Button } from '~/shared/components/ui/button'
import { useAppForm } from '~/shared/components/ui/form'
import { Input } from '~/shared/components/ui/input'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { Textarea } from '~/shared/components/ui/textarea'
import { useUpdateGroupMutation } from '../hooks/mutations/use-update-group.mutation'
import { useGroupDetailsQuery } from '../hooks/queries/use-group-details.query'
import { useGroupIdParam } from '../hooks/use-group-id-param'

export function EditGroupDialog({ children }: Readonly<PropsWithChildren>) {
	const [open, setOpen] = useState(false)
	const [isLoading, startTransition] = useTransition()
	const updateGroupMutation = useUpdateGroupMutation()
	const groupId = useGroupIdParam()
	const { data: group } = useGroupDetailsQuery(groupId)

	const form = useAppForm({
		defaultValues: {
			name: group?.name ?? '',
			description: group?.description ?? '',
		},
		onSubmit: async ({ value: { name, description } }) => {
			updateGroupMutation.mutate(
				{
					id: groupId,
					name,
					description,
				},
				{
					onSuccess: () => {
						setOpen(false)
					},
				},
			)
		},
	})

	if (group && open) {
		form.setFieldValue('name', group.name)
		form.setFieldValue('description', group.description ?? '')
	}

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
			title="Edit Group"
			description="Update group information and settings"
		>
			<ModalTrigger>{children}</ModalTrigger>

			<form.AppForm>
				<form onSubmit={handleSubmit} className="space-y-4">
					<form.AppField
						name="name"
						validators={{
							onBlur: z
								.string()
								.min(1, { message: 'Group name is required' })
								.max(50, {
									message: 'Group name must be 50 characters or less',
								}),
						}}
					>
						{field => (
							<field.FormItem>
								<field.FormLabel>Group Name</field.FormLabel>
								<field.FormControl>
									<Input
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
							onBlur: z.string().max(200, {
								message: 'Description must be 200 characters or less',
							}),
						}}
					>
						{field => (
							<field.FormItem>
								<field.FormLabel>Description (Optional)</field.FormLabel>
								<field.FormControl>
									<Textarea
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
				</form>
			</form.AppForm>

			<ModalFooter>
				<Button
					variant="outline"
					onClick={() => setOpen(false)}
					disabled={isLoading || updateGroupMutation.isPending}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isLoading || updateGroupMutation.isPending}
				>
					{isLoading || updateGroupMutation.isPending
						? 'Updating...'
						: 'Update Group'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
