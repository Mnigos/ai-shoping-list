import { useState } from 'react'
import { CreateGroupDialog } from './create-group-dialog'
import { TransferListModal } from './transfer-list-modal'

interface GroupCreationFlowProps {
	children: React.ReactNode
	onComplete?: () => void
}

export function GroupCreationFlow({
	children,
	onComplete,
}: GroupCreationFlowProps) {
	const [showTransferModal, setShowTransferModal] = useState(false)
	const [newGroup, setNewGroup] = useState<{ id: string; name: string } | null>(
		null,
	)

	function handleGroupCreated(group: { id: string; name: string }) {
		setNewGroup(group)
		setShowTransferModal(true)
	}

	function handleTransferComplete() {
		setShowTransferModal(false)
		setNewGroup(null)
		onComplete?.()
	}

	return (
		<>
			<CreateGroupDialog onGroupCreated={handleGroupCreated}>
				{children}
			</CreateGroupDialog>

			{newGroup && (
				<TransferListModal
					open={showTransferModal}
					onOpenChange={setShowTransferModal}
					newGroup={newGroup}
					onComplete={handleTransferComplete}
				/>
			)}
		</>
	)
}
