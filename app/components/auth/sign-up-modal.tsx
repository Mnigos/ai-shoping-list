import { AuthModal } from './auth-modal'
import { SignUpForm } from './sign-up-form'

interface SignUpModalProps {
	onClose?: () => void
	isOpen: boolean
}

export function SignUpModal({ onClose, isOpen }: Readonly<SignUpModalProps>) {
	return (
		<AuthModal
			title="Sign Up"
			description="Create your account to get started."
			onClose={onClose}
			isOpen={isOpen}
		>
			<div className="flex justify-center">
				<SignUpForm onSuccess={onClose} />
			</div>
		</AuthModal>
	)
}
