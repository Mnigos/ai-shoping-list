import { type PropsWithChildren, useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { useDeleteGroupMutation } from '../hooks/mutations/use-delete-group.mutation'
import { useGroupIdParam } from '../hooks/use-group-id-param'

export function DeleteGroupDialog({ children }: Readonly<PropsWithChildren>) {
	const [open, setOpen] = useState(false)
	const groupId = useGroupIdParam()
	const deleteGroupMutation = useDeleteGroupMutation()

	function handleDelete() {
		deleteGroupMutation.mutate(
			{ id: groupId },
			{
				onSuccess: () => {
					setOpen(false)
				},
			},
		)
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Delete Group"
			description="Are you sure you want to delete this group? This action cannot be undone. All shopping lists and data associated with this group will be permanently deleted."
			contentClassName="sm:max-w-md"
		>
			<ModalTrigger>{children}</ModalTrigger>

			<ModalFooter>
				<Button
					variant="outline"
					onClick={() => setOpen(false)}
					disabled={deleteGroupMutation.isPending}
				>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={deleteGroupMutation.isPending}
				>
					{deleteGroupMutation.isPending ? 'Deleting...' : 'Delete Group'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
