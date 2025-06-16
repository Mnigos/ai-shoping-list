import { XIcon } from 'lucide-react'
import type { ComponentProps, PropsWithChildren } from 'react'
import { useMediaQuery } from '~/shared/hooks/use-media-query'
import { cn } from '~/shared/utils/cn'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from './drawer'

interface ModalProps extends PropsWithChildren {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	title?: string
	description?: string
	canClose?: boolean
	className?: string
	titleClassName?: string
	contentClassName?: string
}

export function Modal({
	open,
	onOpenChange,
	title,
	description,
	children,
	canClose = true,
	className,
	titleClassName,
	contentClassName,
}: Readonly<ModalProps>) {
	const isMediumScreen = useMediaQuery('md')

	const onOpenChangeHandler = canClose ? onOpenChange : undefined

	if (isMediumScreen) {
		return (
			<Dialog open={open} onOpenChange={onOpenChangeHandler}>
				<DialogContent
					className={cn('sm:max-w-md', contentClassName)}
					showCloseButton={canClose}
				>
					{(title || description) && (
						<DialogHeader>
							{title && (
								<DialogTitle
									className={cn('text-center text-xl', titleClassName)}
								>
									{title}
								</DialogTitle>
							)}
							{description && (
								<DialogDescription className="text-center">
									{description}
								</DialogDescription>
							)}
						</DialogHeader>
					)}

					<div className={className}>{children}</div>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChangeHandler}>
			<DrawerContent className={cn('h-full gap-6 p-6', contentClassName)}>
				{(title || description || canClose) && (
					<DrawerHeader className="text-center">
						<div className="flex items-center justify-between">
							{title && (
								<DrawerTitle className={cn('flex-1 text-xl', titleClassName)}>
									{title}
								</DrawerTitle>
							)}
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
				)}
				<div className={className}>{children}</div>
			</DrawerContent>
		</Drawer>
	)
}

interface ModalTriggerProps extends PropsWithChildren {
	className?: string
}

export function ModalTrigger({
	children,
	className,
	...props
}: Readonly<ModalTriggerProps & ComponentProps<'button'>>) {
	const isMediumScreen = useMediaQuery('md')

	if (isMediumScreen) {
		return (
			<DialogTrigger asChild className={className} {...props}>
				{children}
			</DialogTrigger>
		)
	}

	return (
		<DrawerTrigger asChild className={className} {...props}>
			{children}
		</DrawerTrigger>
	)
}

interface ModalFooterProps extends PropsWithChildren {
	className?: string
}

export function ModalFooter({
	children,
	className,
}: Readonly<ModalFooterProps>) {
	const isMediumScreen = useMediaQuery('md')

	if (isMediumScreen) {
		return (
			<div
				className={cn(
					'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
					className,
				)}
			>
				{children}
			</div>
		)
	}

	return (
		<div className={cn('mt-auto flex flex-col gap-2', className)}>
			{children}
		</div>
	)
}
