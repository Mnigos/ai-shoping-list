import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useMediaQuery } from './use-media-query'

describe('useMediaQuery', () => {
	const breakpoints = {
		sm: '(min-width: 640px)',
		md: '(min-width: 768px)',
		lg: '(min-width: 1024px)',
		xl: '(min-width: 1280px)',
		'2xl': '(min-width: 1536px)',
	}

	// Mock media query list
	const mockMediaQueryList = {
		matches: false,
		media: '',
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
	}

	const mockMatchMedia = vi.fn(() => mockMediaQueryList)

	beforeEach(() => {
		vi.clearAllMocks()

		// Mock window.matchMedia
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: mockMatchMedia,
		})

		// Reset mock media query list state
		mockMediaQueryList.matches = false
		mockMediaQueryList.addEventListener = vi.fn()
		mockMediaQueryList.removeEventListener = vi.fn()
	})

	describe('without breakpoint parameter', () => {
		test('should return false when no breakpoint is provided', () => {
			const { result } = renderHook(() => useMediaQuery())

			expect(result.current).toBeFalsy()
		})

		test('should not call matchMedia when no breakpoint is provided', () => {
			renderHook(() => useMediaQuery())

			expect(mockMatchMedia).not.toHaveBeenCalled()
		})

		test('should not set up event listeners when no breakpoint is provided', () => {
			renderHook(() => useMediaQuery())

			expect(mockMediaQueryList.addEventListener).not.toHaveBeenCalled()
		})
	})

	describe('with breakpoint parameter', () => {
		test.each([
			{ breakpoint: 'sm', query: '(min-width: 640px)' },
			{ breakpoint: 'md', query: '(min-width: 768px)' },
			{ breakpoint: 'lg', query: '(min-width: 1024px)' },
			{ breakpoint: 'xl', query: '(min-width: 1280px)' },
			{ breakpoint: '2xl', query: '(min-width: 1536px)' },
		])(
			'should call matchMedia with correct query for $breakpoint breakpoint',
			({ breakpoint, query }) => {
				renderHook(() => useMediaQuery(breakpoint as keyof typeof breakpoints))

				expect(mockMatchMedia).toHaveBeenCalledWith(query)
			},
		)

		test('should return false initially before mount', () => {
			const { result } = renderHook(() => useMediaQuery('md'))

			// Initial render should return false as isMounted starts as false
			expect(result.current).toBeFalsy()
		})

		test('should return query matches state after mount', () => {
			mockMediaQueryList.matches = true

			const { result, rerender } = renderHook(() => useMediaQuery('md'))

			// Force a rerender to trigger the effect
			rerender()

			expect(result.current).toBeTruthy()
		})

		test('should set up event listener for media query changes', () => {
			renderHook(() => useMediaQuery('lg'))

			expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
				'change',
				expect.any(Function),
			)
		})

		test('should clean up event listener on unmount', () => {
			const { unmount } = renderHook(() => useMediaQuery('xl'))

			unmount()

			expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
				'change',
				expect.any(Function),
			)
		})

		test('should update matches state when media query changes', () => {
			let changeListener: (event: MediaQueryListEvent) => void

			mockMediaQueryList.addEventListener.mockImplementation(
				(event, listener) => {
					if (event === 'change') {
						changeListener = listener as (event: MediaQueryListEvent) => void
					}
				},
			)

			// Initial state - not matching
			mockMediaQueryList.matches = false
			const { result } = renderHook(() => useMediaQuery('sm'))

			// After initial render and effect, should be false (not matching)
			expect(result.current).toBeFalsy()

			// Simulate media query change to matching
			act(() => {
				const mockEvent = { matches: true } as MediaQueryListEvent
				changeListener!(mockEvent)
			})

			expect(result.current).toBeTruthy()

			// Simulate media query change to not matching
			act(() => {
				const mockEventNotMatching = { matches: false } as MediaQueryListEvent
				changeListener!(mockEventNotMatching)
			})

			expect(result.current).toBeFalsy()
		})

		test('should handle breakpoint change during hook lifecycle', () => {
			const { result, rerender } = renderHook(
				({ breakpoint }: { breakpoint: keyof typeof breakpoints }) =>
					useMediaQuery(breakpoint),
				{ initialProps: { breakpoint: 'sm' as keyof typeof breakpoints } },
			)

			// Verify initial breakpoint is set up
			expect(mockMatchMedia).toHaveBeenCalledWith(breakpoints.sm)

			// Change breakpoint
			mockMatchMedia.mockClear()
			rerender({ breakpoint: 'lg' as keyof typeof breakpoints })

			// Verify new breakpoint is set up
			expect(mockMatchMedia).toHaveBeenCalledWith(breakpoints.lg)
		})

		test('should remove old event listener when breakpoint changes', () => {
			const { rerender } = renderHook(
				({ breakpoint }: { breakpoint: keyof typeof breakpoints }) =>
					useMediaQuery(breakpoint),
				{ initialProps: { breakpoint: 'sm' as keyof typeof breakpoints } },
			)

			const firstListener = mockMediaQueryList.addEventListener.mock.calls[0][1]

			// Change breakpoint
			rerender({ breakpoint: 'md' as keyof typeof breakpoints })

			// Should remove the old listener
			expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
				'change',
				firstListener,
			)
		})
	})

	describe('edge cases', () => {
		test('should handle undefined breakpoint parameter', () => {
			const { result } = renderHook(() => useMediaQuery(undefined))

			expect(result.current).toBeFalsy()
			expect(mockMatchMedia).not.toHaveBeenCalled()
		})

		test('should handle switching from valid breakpoint to undefined', () => {
			const { result, rerender } = renderHook(
				({ breakpoint }: { breakpoint?: keyof typeof breakpoints }) =>
					useMediaQuery(breakpoint),
				{ initialProps: { breakpoint: 'md' as keyof typeof breakpoints } },
			)

			// Initially has a breakpoint
			expect(mockMatchMedia).toHaveBeenCalledWith(breakpoints.md)

			// Switch to undefined
			rerender({ breakpoint: undefined as any })

			expect(result.current).toBeFalsy()
		})

		test('should handle switching from undefined to valid breakpoint', () => {
			const { result, rerender } = renderHook(
				({ breakpoint }: { breakpoint?: keyof typeof breakpoints }) =>
					useMediaQuery(breakpoint),
				{ initialProps: { breakpoint: undefined } },
			)

			// Initially no breakpoint
			expect(result.current).toBeFalsy()
			expect(mockMatchMedia).not.toHaveBeenCalled()

			// Switch to valid breakpoint
			mockMatchMedia.mockClear()
			rerender({ breakpoint: 'lg' as any })

			expect(mockMatchMedia).toHaveBeenCalledWith(breakpoints.lg)
		})

		test('should handle matchMedia not being available', () => {
			// Remove matchMedia from window
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: undefined,
			})

			// Should not throw error
			expect(() => {
				renderHook(() => useMediaQuery('md'))
			}).toThrow()
		})
	})

	describe('mount behavior', () => {
		test('should return matching state after mount when query matches', () => {
			// Set up matching query
			mockMediaQueryList.matches = true

			const { result } = renderHook(() => useMediaQuery('md'))

			// After effect runs, should return actual match state
			expect(result.current).toBeTruthy()
		})

		test('should return false when query does not match', () => {
			mockMediaQueryList.matches = false

			const { result } = renderHook(() => useMediaQuery('xl'))

			// Should return false when query doesn't match
			expect(result.current).toBeFalsy()
		})

		test('should handle switching between matching and non-matching states via events', () => {
			let changeListener: (event: MediaQueryListEvent) => void

			mockMediaQueryList.addEventListener.mockImplementation(
				(event, listener) => {
					if (event === 'change') {
						changeListener = listener as (event: MediaQueryListEvent) => void
					}
				},
			)

			// Start with non-matching
			mockMediaQueryList.matches = false
			const { result } = renderHook(() => useMediaQuery('lg'))

			expect(result.current).toBeFalsy()

			// Simulate media query change to matching
			act(() => {
				const mockEvent = { matches: true } as MediaQueryListEvent
				changeListener!(mockEvent)
			})

			expect(result.current).toBeTruthy()

			// Simulate media query change back to non-matching
			act(() => {
				const mockEvent = { matches: false } as MediaQueryListEvent
				changeListener!(mockEvent)
			})

			expect(result.current).toBeFalsy()
		})
	})
})
