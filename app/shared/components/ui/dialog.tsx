import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '~/shared/utils/cn'

export function Dialog({
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Root>>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger({
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Trigger>>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

export function DialogPortal({
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Portal>>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

export function DialogClose({
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Close>>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export function DialogOverlay({
	className,
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Overlay>>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
				className,
			)}
			{...props}
		/>
	)
}

interface DialogContentProps
	extends ComponentProps<typeof DialogPrimitive.Content> {
	showCloseButton?: boolean
}

export function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: Readonly<DialogContentProps>) {
	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg',
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className="absolute top-4 right-4 cursor-pointer rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	)
}

export function DialogHeader({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			data-slot="dialog-header"
			className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
			{...props}
		/>
	)
}

export function DialogFooter({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
				className,
			)}
			{...props}
		/>
	)
}

export function DialogTitle({
	className,
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Title>>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('font-semibold text-lg leading-none', className)}
			{...props}
		/>
	)
}

export function DialogDescription({
	className,
	...props
}: Readonly<ComponentProps<typeof DialogPrimitive.Description>>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}
