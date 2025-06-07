import type { ReactNode } from 'react'
import { useCanPerformGroupActions } from '~/shared/hooks/use-auth-status'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'

interface AnonymousUserGuardProps {
	children: ReactNode
	fallback?: ReactNode
	tooltipContent?: string
	disabled?: boolean
}

/**
 * Guard component that disables actions for anonymous users
 * Shows a tooltip prompting users to sign up when disabled
 */
export function AnonymousUserGuard({
	children,
	fallback,
	tooltipContent = 'Please sign up to create and join groups',
	disabled = false,
}: Readonly<AnonymousUserGuardProps>) {
	const canPerformGroupActions = useCanPerformGroupActions()
	const shouldDisable = disabled || !canPerformGroupActions

	if (shouldDisable && fallback) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div>{fallback}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{tooltipContent}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	if (shouldDisable) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="cursor-not-allowed opacity-50">{children}</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{tooltipContent}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return <>{children}</>
}

/**
 * Higher-order component that wraps children with anonymous user protection
 * Useful for protecting entire sections or forms
 */
export function withAnonymousUserGuard<T extends object>(
	Component: React.ComponentType<T>,
	options?: {
		tooltipContent?: string
		fallback?: ReactNode
	},
) {
	return function GuardedComponent(props: T) {
		return (
			<AnonymousUserGuard
				tooltipContent={options?.tooltipContent}
				fallback={options?.fallback}
			>
				<Component {...props} />
			</AnonymousUserGuard>
		)
	}
}
