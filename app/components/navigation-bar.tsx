import type { ComponentProps } from 'react'
import { cn } from '~/utils/cn'
import { Button } from './ui/button'

interface NavigationBarProps extends ComponentProps<'nav'> {}

export function NavigationBar({
	className,
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
				<div className="flex items-center space-x-2">
					<h1 className="font-bold text-xl">AI Shopping List</h1>
				</div>

				<div className="flex items-center space-x-2">
					<Button variant="ghost" size="sm">
						Sign In
					</Button>
					<Button size="sm">Sign Up</Button>
				</div>
			</div>
		</nav>
	)
}
