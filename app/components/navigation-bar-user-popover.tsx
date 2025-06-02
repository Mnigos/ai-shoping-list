import type { UserWithAnonymous } from 'better-auth/plugins'
import { LogOut, User as UserIcon } from 'lucide-react'
import { authClient } from '~/lib/auth-client'
import { useChatStore } from '~/stores/chat.store'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export interface NavigationBarUserPopoverProps {
	user: Pick<UserWithAnonymous, 'name' | 'email' | 'isAnonymous'>
}

export function NavigationBarUserPopover({
	user,
}: Readonly<NavigationBarUserPopoverProps>) {
	const clearMessages = useChatStore(state => state.clearMessages)

	async function handleSignOut() {
		await authClient.signOut()
		clearMessages()
		window.location.reload()
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon" aria-label="User">
					<UserIcon className="h-4 w-4" />
				</Button>
			</PopoverTrigger>

			<PopoverContent className="gap-2">
				<div>
					<p className="">{user.name}</p>
					<p className="max-w-64 truncate text-foreground/50 text-sm">
						{user.email}
					</p>
				</div>

				<Button variant="outline" onClick={handleSignOut}>
					<LogOut className="h-4 w-4" />
					Sign Out
				</Button>
			</PopoverContent>
		</Popover>
	)
}
