import { CheckIcon, CopyIcon } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'
import { Modal, ModalFooter, ModalTrigger } from '~/shared/components/ui/modal'
import { useRegenerateInviteCodeMutation } from '../../hooks/mutations/use-regenerate-invite-code.mutation'
import { useGroupDetailsQuery } from '../../hooks/queries/use-group-details.query'
import { useGroupIdParam } from '../../hooks/use-group-id-param'

export function InviteLinkModal({ children }: Readonly<PropsWithChildren>) {
	const [open, setOpen] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const groupId = useGroupIdParam()
	const { data: group } = useGroupDetailsQuery(groupId)
	const regenerateInviteCodeMutation = useRegenerateInviteCodeMutation()

	const inviteCode = group?.inviteCode
	const inviteLink =
		inviteCode && typeof window !== 'undefined'
			? `${window.location.origin}/invite/${inviteCode}`
			: ''

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 2000)
		} catch (error) {
			console.error('Failed to copy text: ', error)
		}
	}

	function handleCopyLink() {
		if (inviteLink) {
			copyToClipboard(inviteLink)
		}
	}

	function handleRegenerateCode() {
		regenerateInviteCodeMutation.mutate({ id: groupId })
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Share Group"
			description="Share this link with others to invite them to join your group."
		>
			<ModalTrigger>{children}</ModalTrigger>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="invite-link">Invite Link</Label>
					<div className="flex gap-2">
						<Input
							id="invite-link"
							type="text"
							readOnly
							value={inviteLink}
							className="font-mono text-sm"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleCopyLink}
							disabled={!inviteLink}
						>
							{isCopied ? (
								<CheckIcon className="size-4" />
							) : (
								<CopyIcon className="size-4" />
							)}
							<span className="sr-only">
								{isCopied ? 'Copied' : 'Copy link'}
							</span>
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="invite-code">Invite Code</Label>
					<div className="flex gap-2">
						<Input
							id="invite-code"
							type="text"
							readOnly
							value={inviteCode || ''}
							className="font-mono text-sm"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => copyToClipboard(inviteCode || '')}
							disabled={!inviteCode}
						>
							{isCopied ? (
								<CheckIcon className="size-4" />
							) : (
								<CopyIcon className="size-4" />
							)}
							<span className="sr-only">
								{isCopied ? 'Copied' : 'Copy code'}
							</span>
						</Button>
					</div>
				</div>

				<div className="text-muted-foreground text-sm">
					<p>
						Anyone with this link or code can join your group. You can
						regenerate the code at any time to revoke access.
					</p>
				</div>
			</div>

			<ModalFooter>
				<Button
					variant="outline"
					onClick={handleRegenerateCode}
					disabled={regenerateInviteCodeMutation.isPending}
				>
					{regenerateInviteCodeMutation.isPending
						? 'Regenerating...'
						: 'Regenerate Code'}
				</Button>
				<Button onClick={() => setOpen(false)}>Done</Button>
			</ModalFooter>
		</Modal>
	)
}
