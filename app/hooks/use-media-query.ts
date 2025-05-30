import { useEffect, useState } from 'react'

const breakpoints = {
	sm: '(min-width: 640px)',
	md: '(min-width: 768px)',
	lg: '(min-width: 1024px)',
	xl: '(min-width: 1280px)',
	'2xl': '(min-width: 1536px)',
} as const

type Breakpoint = keyof typeof breakpoints

export function useMediaQuery(breakpoint?: Breakpoint): boolean {
	const [isMounted, setIsMounted] = useState(false)
	const [matches, setMatches] = useState(false)

	useEffect(() => {
		setIsMounted(true)

		if (!breakpoint) return

		const query = window.matchMedia(breakpoints[breakpoint])
		setMatches(query.matches)

		function listener({ matches }: MediaQueryListEvent) {
			setMatches(matches)
		}

		query.addEventListener('change', listener)

		return () => {
			query.removeEventListener('change', listener)
		}
	}, [breakpoint])

	if (!isMounted || !breakpoint) return false

	return matches
}
