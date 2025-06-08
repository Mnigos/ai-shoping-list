import { Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/shared/components/ui/dialog'
import { Input } from '~/shared/components/ui/input'
import { Label } from '~/shared/components/ui/label'

interface InviteLinkDialogProps {
	groupId: string
	groupName: string
	isOpen: boolean
	onClose: () => void
}

interface InviteLinkResult {
	inviteUrl: string
	token: string
	expiresAt: Date
}

export function InviteLinkDialog({
	groupId,
	groupName,
	isOpen,
	onClose,
}: InviteLinkDialogProps) {
	const [expiresInHours, setExpiresInHours] = useState<string>('168') // 7 days default
	const [generatedLink, setGeneratedLink] = useState<string>('')
	const [expiresAt, setExpiresAt] = useState<Date | null>(null)
	const [message, setMessage] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)

	async function handleCopyLink() {
		if (!generatedLink) return

		try {
			await navigator.clipboard.writeText(generatedLink)
			setMessage({ type: 'success', text: 'Link copied to clipboard!' })
		} catch (error) {
			setMessage({
				type: 'error',
				text: 'Failed to copy link. Please copy manually.',
			})
		}
	}

	function handleOpenLink() {
		if (generatedLink) {
			window.open(generatedLink, '_blank')
		}
	}

	function handleClose() {
		setGeneratedLink('')
		setExpiresAt(null)
		setMessage(null)
		onClose()
	}

	function formatExpirationDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(date)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Generate Invite Link</DialogTitle>
					<DialogDescription>
						Create a shareable link for others to join "{groupName}".
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{message && (
						<div
							className={`rounded-md p-3 ${
								message.type === 'success'
									? 'border border-green-200 bg-green-50 text-green-800'
									: 'border border-red-200 bg-red-50 text-red-800'
							}`}
						>
							<p className="text-sm">{message.text}</p>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="expiration">Link expires in</Label>
						<select
							id="expiration"
							value={expiresInHours}
							onChange={e => setExpiresInHours(e.target.value)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							<option value="24">1 day</option>
							<option value="72">3 days</option>
							<option value="168">1 week</option>
							<option value="336">2 weeks</option>
							<option value="720">1 month</option>
						</select>
					</div>

					<Button className="w-full">Generate Invite Link</Button>

					{generatedLink && (
						<div className="space-y-3">
							<div className="space-y-2">
								<Label htmlFor="invite-link">Invite Link</Label>
								<div className="flex space-x-2">
									<Input
										id="invite-link"
										value={generatedLink}
										readOnly
										className="flex-1"
									/>
									<Button size="sm" variant="outline" onClick={handleCopyLink}>
										<Copy className="h-4 w-4" />
									</Button>
									<Button size="sm" variant="outline" onClick={handleOpenLink}>
										<ExternalLink className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{expiresAt && (
								<p className="text-muted-foreground text-sm">
									Expires on {formatExpirationDate(expiresAt)}
								</p>
							)}

							<div className="rounded-md bg-muted p-3">
								<p className="text-muted-foreground text-sm">
									Anyone with this link can join your group. Share it only with
									people you trust.
								</p>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
