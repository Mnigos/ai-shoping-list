import { AuthModal } from './auth-modal'
import { SignInForm } from './sign-in-form'

interface SignInModalProps {
	onClose?: () => void
	isOpen: boolean
}

export function SignInModal({ onClose, isOpen }: Readonly<SignInModalProps>) {
	return (
		<AuthModal
			title="Sign In"
			description="Welcome back! Please sign in to your account."
			onClose={onClose}
			isOpen={isOpen}
		>
			<div className="flex justify-center">
				<SignInForm onSuccess={onClose} />
			</div>
		</AuthModal>
	)
}
