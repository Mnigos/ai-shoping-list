import type { ComponentProps } from 'react'
import { useState } from 'react'
import { cn } from '~/utils/cn'
import { SignInModal } from './auth/sign-in-modal'
import { SignUpModal } from './auth/sign-up-modal'
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
	const [showSignInModal, setShowSignInModal] = useState(false)
	const [showSignUpModal, setShowSignUpModal] = useState(false)

	return (
		<>
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

					<div className="flex items-center space-x-2">
						{user && user.name !== 'Anonymous' ? (
							<NavigationBarUserPopover user={user} />
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowSignInModal(true)}
								>
									Sign In
								</Button>
								<Button size="sm" onClick={() => setShowSignUpModal(true)}>
									Sign Up
								</Button>
							</>
						)}
					</div>
				</div>
			</nav>

			<SignInModal
				onClose={() => setShowSignInModal(false)}
				isOpen={showSignInModal}
			/>

			<SignUpModal
				onClose={() => setShowSignUpModal(false)}
				isOpen={showSignUpModal}
			/>
		</>
	)
}
