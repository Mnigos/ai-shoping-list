import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { useGroupDetailsQuery } from '../hooks/queries/use-group-details.query'
import { useGroupIdParam } from '../hooks/use-group-id-param'

interface TransferListModalProps extends PropsWithChildren {
	listId: string
	listName: string
	onTransfer?: (targetGroupId: string) => void
}

export function TransferListModal({
	children,
	listId,
	listName,
	onTransfer,
}: Readonly<TransferListModalProps>) {
	const [open, setOpen] = useState(false)
	const [selectedGroupId, setSelectedGroupId] = useState<string>('')
	const currentGroupId = useGroupIdParam()
	const { data: currentGroup } = useGroupDetailsQuery(currentGroupId)

	// This would typically come from a hook that fetches all user's groups
	// For now, we'll use a placeholder
	const availableGroups = currentGroup ? [currentGroup] : []

	function handleTransfer() {
		if (selectedGroupId && onTransfer) {
			onTransfer(selectedGroupId)
			setOpen(false)
		}
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Transfer Shopping List"
			description={`Move "${listName}" to a different group.`}
		>
			<ModalTrigger>{children}</ModalTrigger>

			<div className="space-y-4">
				<div className="space-y-2">
					<label htmlFor="group-select" className="font-medium text-sm">
						Select destination group:
					</label>
					<select
						id="group-select"
						value={selectedGroupId}
						onChange={e => setSelectedGroupId(e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						<option value="">Choose a group...</option>
						{availableGroups
							.filter(group => group.id !== currentGroupId)
							.map(group => (
								<option key={group.id} value={group.id}>
									{group.name}
								</option>
							))}
					</select>
				</div>

				{availableGroups.filter(g => g.id !== currentGroupId).length === 0 && (
					<div className="rounded-md bg-muted p-3">
						<p className="text-muted-foreground text-sm">
							You don't have any other groups to transfer this list to.
						</p>
					</div>
				)}
			</div>

			<ModalFooter>
				<Button variant="outline" onClick={() => setOpen(false)}>
					Cancel
				</Button>
				<Button onClick={handleTransfer} disabled={!selectedGroupId}>
					Transfer List
				</Button>
			</ModalFooter>
		</Modal>
	)
}
