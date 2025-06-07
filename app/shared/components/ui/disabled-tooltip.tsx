import type { ReactNode } from 'react'
import { Button } from './button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

interface DisabledTooltipProps {
	children: ReactNode
	disabled: boolean
	tooltipContent: string
	showSignUpPrompt?: boolean
}

/**
 * Tooltip component that shows helpful messages for disabled states
 * Automatically handles the disabled styling and tooltip behavior
 */
export function DisabledTooltip({
	children,
	disabled,
	tooltipContent,
	showSignUpPrompt = false,
}: Readonly<DisabledTooltipProps>) {
	if (!disabled) {
		return <>{children}</>
	}

	const content = showSignUpPrompt ? (
		<div className="flex flex-col gap-2 text-center">
			<p>{tooltipContent}</p>
			<Button
				size="sm"
				variant="outline"
				onClick={() => {
					// This will trigger the sign up modal from the navigation
					const signUpButton = document.querySelector(
						'[data-sign-up-trigger]',
					) as HTMLButtonElement
					signUpButton?.click()
				}}
			>
				Sign Up
			</Button>
		</div>
	) : (
		<p>{tooltipContent}</p>
	)

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="cursor-not-allowed">
						<div className="pointer-events-none opacity-50">{children}</div>
					</div>
				</TooltipTrigger>
				<TooltipContent className="max-w-xs">{content}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

/**
 * Specialized component for buttons that need to be disabled with tooltips
 */
export function DisabledButton({
	children,
	disabled,
	tooltipContent,
	showSignUpPrompt = false,
	onClick,
	...buttonProps
}: Readonly<
	DisabledTooltipProps & {
		onClick?: () => void
	} & React.ComponentProps<typeof Button>
>) {
	if (!disabled) {
		return (
			<Button onClick={onClick} {...buttonProps}>
				{children}
			</Button>
		)
	}

	return (
		<DisabledTooltip
			disabled={disabled}
			tooltipContent={tooltipContent}
			showSignUpPrompt={showSignUpPrompt}
		>
			<Button disabled {...buttonProps}>
				{children}
			</Button>
		</DisabledTooltip>
	)
}
