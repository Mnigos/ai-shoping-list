import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '~/lib/trpc/react'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/shared/components/ui/dialog'
import { getPersonalGroup } from '../hooks/helpers/group-helpers'
import { useGroups } from '../hooks/use-groups'
import { useTransferListMutation } from '../hooks/use-transfer-list-mutation'

interface TransferListModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	newGroup: { id: string; name: string }
	onComplete: () => void
}

export function TransferListModal({
	open,
	onOpenChange,
	newGroup,
	onComplete,
}: TransferListModalProps) {
	const [isTransferring, setIsTransferring] = useState(false)
	const trpc = useTRPC()
	const { data: groups = [] } = useGroups()
	const transferMutation = useTransferListMutation()

	// Get current shopping list items to show count
	const { data: currentItems = [] } = useQuery(
		trpc.shoppingList.getItems.queryOptions(),
	)

	const personalGroup = getPersonalGroup(groups)
	const itemCount = currentItems.length

	function handleTransfer() {
		if (!personalGroup) return

		setIsTransferring(true)
		transferMutation.mutate(
			{
				fromGroupId: personalGroup.id,
				toGroupId: newGroup.id,
			},
			{
				onSuccess: () => {
					setIsTransferring(false)
					onOpenChange(false)
					onComplete()
				},
				onError: () => {
					setIsTransferring(false)
				},
			},
		)
	}

	function handleKeepPersonal() {
		onOpenChange(false)
		onComplete()
	}

	// Don't show modal if no items to transfer
	if (itemCount === 0) {
		return null
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Transfer Your Shopping List?</DialogTitle>
					<DialogDescription>
						You have {itemCount} item{itemCount !== 1 ? 's' : ''} in your
						personal shopping list. Would you like to transfer them to your new
						group "{newGroup.name}"?
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="rounded-md bg-muted p-4">
						<p className="text-muted-foreground text-sm">
							<strong>Transfer Items:</strong> Your {itemCount} item
							{itemCount !== 1 ? 's' : ''} will be moved to "{newGroup.name}"
							and shared with all group members.
						</p>
						<p className="mt-2 text-muted-foreground text-sm">
							<strong>Keep Personal:</strong> Your items will stay in your
							personal list, and you'll start fresh in the new group.
						</p>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleKeepPersonal}
						disabled={isTransferring}
					>
						Keep Personal
					</Button>
					<Button
						type="button"
						onClick={handleTransfer}
						disabled={isTransferring || !personalGroup}
					>
						{isTransferring ? 'Transferring...' : 'Transfer Items'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
