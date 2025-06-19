import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { useGroupDetailsQuery } from '../../hooks/queries/use-group-details.query'
import { useGroupIdParam } from '../../hooks/use-group-id-param'
import { GroupMemberList } from '../group-member-list'

export function MemberManagementDialog({
	children,
}: Readonly<PropsWithChildren>) {
	const [open, setOpen] = useState(false)
	const groupId = useGroupIdParam()
	const { data: group } = useGroupDetailsQuery(groupId)

	if (!group) {
		return null
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Manage Members"
			description={`Manage members of "${group.name}"`}
			contentClassName="sm:max-w-2xl"
		>
			<ModalTrigger>{children}</ModalTrigger>

			<div className="space-y-4">
				<div className="text-muted-foreground text-sm">
					<p>Members: {group.membersCount}</p>
				</div>

				<GroupMemberList
					groupId={groupId}
					currentUserRole={group.myRole}
					isPersonalGroup={group.isPersonal}
					members={group.members}
				/>
			</div>

			<ModalFooter>
				<Button onClick={() => setOpen(false)}>Close</Button>
			</ModalFooter>
		</Modal>
	)
}
