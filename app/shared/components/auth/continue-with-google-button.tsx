import { LoaderCircle } from 'lucide-react'
import { useTransition } from 'react'
import { authClient } from '~/lib/auth-client'
import { GoogleIcon } from '~/shared/assets/icons'
import { Button } from '../ui/button'

interface ContinueWithGoogleButtonProps {
	setError: (error: string) => void
	onSuccess?: () => void
	callbackURL?: string
}

export function ContinueWithGoogleButton({
	setError,
	onSuccess,
	callbackURL = '/',
}: Readonly<ContinueWithGoogleButtonProps>) {
	const [isLoading, startTransition] = useTransition()

	function handleContinueWithGoogle() {
		setError('')
		startTransition(async () => {
			await authClient.signIn.social(
				{
					provider: 'google',
					callbackURL,
				},
				{
					onSuccess: () => {
						onSuccess?.()
					},
					onError: ({ error }) => {
						setError(error.message)
					},
				},
			)
		})
	}

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleContinueWithGoogle}
			disabled={isLoading}
			className="w-full"
		>
			{isLoading ? (
				<>
					<LoaderCircle className="animate-spin" />
					Signing in...
				</>
			) : (
				<>
					<GoogleIcon className="h-4 w-4" />
					Continue with Google
				</>
			)}
		</Button>
	)
}
