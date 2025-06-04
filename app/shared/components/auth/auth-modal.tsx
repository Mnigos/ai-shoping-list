import { XIcon } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useMediaQuery } from '~/shared/hooks/use-media-query'
import { cn } from '~/shared/utils/cn'
import { Button } from '../ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from '../ui/drawer'

interface AuthModalProps extends PropsWithChildren {
	onClose?: () => void
	isOpen: boolean
	title: string
	description?: string
	canClose?: boolean
	className?: string
	titleClassName?: string
}

export function AuthModal({
	isOpen,
	title,
	description,
	children,
	canClose = true,
	className,
	onClose,
	titleClassName,
}: Readonly<AuthModalProps>) {
	const isMediumScreen = useMediaQuery('md')

	const onOpenChange = canClose ? onClose : undefined

	if (isMediumScreen) {
		return (
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent
					className={cn('sm:max-w-md', className)}
					showCloseButton={canClose}
				>
					<DialogHeader>
						<DialogTitle className={cn('text-center text-xl', titleClassName)}>
							{title}
						</DialogTitle>
						{description && (
							<DialogDescription className="text-center">
								{description}
							</DialogDescription>
						)}
					</DialogHeader>

					{children}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open={isOpen} onOpenChange={onOpenChange}>
			<DrawerContent className={cn('h-full gap-6 p-6', className)}>
				<DrawerHeader className="text-center">
					<div className="flex items-center justify-between">
						<DrawerTitle className={cn('flex-1 text-xl', titleClassName)}>
							{title}
						</DrawerTitle>
						{canClose && (
							<DrawerClose asChild>
								<Button variant="ghost" size="icon">
									<XIcon className="size-4" />
									<span className="sr-only">Close</span>
								</Button>
							</DrawerClose>
						)}
					</div>
					{description && (
						<DrawerDescription className="mt-2">
							{description}
						</DrawerDescription>
					)}
				</DrawerHeader>
				{children}
			</DrawerContent>
		</Drawer>
	)
}
