import type { ComponentProps } from 'react'
import { GroupInterface } from '~/modules/group/components/group-interface'
import { cn } from '~/shared/utils/cn'
import { SignInModal } from './auth/sign-in.modal'
import { SignUpModal } from './auth/sign-up.modal'
import {
	NavigationBarUserPopover,
	type NavigationBarUserPopoverProps,
} from './navigation-bar-user-popover'
import { Button } from './ui/button'

interface NavigationBarProps
	extends ComponentProps<'nav'>,
		Partial<NavigationBarUserPopoverProps> {}

export function NavigationBar({
	className,
	user,
	...props
}: Readonly<NavigationBarProps>) {
	return (
		<nav
			className={cn(
				'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
				className,
			)}
			{...props}
		>
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<header className="flex items-center space-x-2">
					<h1 className="font-bold text-xl">AI Shopping List</h1>
				</header>

				<div className="flex items-center space-x-4">
					{user && !user.isAnonymous ? (
						<>
							<GroupInterface />
							<NavigationBarUserPopover user={user} />
						</>
					) : (
						<>
							<SignInModal>
								<Button variant="ghost" size="sm">
									Sign In
								</Button>
							</SignInModal>
							<SignUpModal>
								<Button size="sm">Sign Up</Button>
							</SignUpModal>
						</>
					)}
				</div>
			</div>
		</nav>
	)
}
