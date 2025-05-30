import type { ComponentProps } from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '~/utils/cn'

export function Drawer({
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Root>>) {
	return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

export function DrawerTrigger({
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Trigger>>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

export function DrawerPortal({
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Portal>>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

export function DrawerClose({
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Close>>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

export function DrawerOverlay({
	className,
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Overlay>>) {
	return (
		<DrawerPrimitive.Overlay
			data-slot="drawer-overlay"
			className={cn(
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
				className,
			)}
			{...props}
		/>
	)
}

export function DrawerContent({
	className,
	children,
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Content>>) {
	return (
		<DrawerPortal data-slot="drawer-portal">
			<DrawerOverlay />
			<DrawerPrimitive.Content
				data-slot="drawer-content"
				className={cn(
					'group/drawer-content fixed z-50 flex h-auto flex-col bg-background',
					'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
					'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
					'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
					'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
					className,
				)}
				{...props}
			>
				<div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	)
}

export function DrawerHeader({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			data-slot="drawer-header"
			className={cn('flex flex-col gap-1.5 p-4', className)}
			{...props}
		/>
	)
}

export function DrawerFooter({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn('mt-auto flex flex-col gap-2 p-4', className)}
			{...props}
		/>
	)
}

export function DrawerTitle({
	className,
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Title>>) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn('font-semibold text-foreground', className)}
			{...props}
		/>
	)
}

export function DrawerDescription({
	className,
	...props
}: Readonly<ComponentProps<typeof DrawerPrimitive.Description>>) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}
