import { LoaderCircle } from 'lucide-react'
import { type PropsWithChildren, useState, useTransition } from 'react'
import { z } from 'zod'
import { authClient } from '~/lib/auth-client'
import { Button } from '../ui/button'
import { Message, useAppForm } from '../ui/form'
import { Input } from '../ui/input'
import { Modal, ModalFooter, ModalTrigger } from '../ui/modal'
import { ContinueWithGoogleButton } from './continue-with-google-button'

interface SignInModalProps extends PropsWithChildren {
	onSuccess?: () => void
	callbackURL?: string
}

export function SignInModal({
	children,
	onSuccess,
	callbackURL = '/',
}: Readonly<SignInModalProps>) {
	const [open, setOpen] = useState(false)
	const [isLoading, startTransition] = useTransition()
	const [error, setError] = useState<string>('')

	const form = useAppForm({
		defaultValues: {
			email: '',
			password: '',
		},
		onSubmit: async ({ value: { email, password } }) => {
			await authClient.signIn.email(
				{
					email,
					password,
					callbackURL,
				},
				{
					onSuccess: () => {
						setOpen(false)
						onSuccess?.()
						window.location.reload()
					},
					onError: ({ error }) => {
						setError(error.message)
					},
				},
			)
		},
	})

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault()
		event.stopPropagation()
		startTransition(async () => {
			await form.handleSubmit()
		})
	}

	return (
		<Modal
			open={open}
			onOpenChange={setOpen}
			title="Sign In"
			description="Welcome back! Please sign in to your account."
		>
			<ModalTrigger>{children}</ModalTrigger>

			<form.AppForm>
				<div className="space-y-4">
					<ContinueWithGoogleButton
						setError={setError}
						callbackURL={callbackURL}
						onSuccess={() => {
							setOpen(false)
							onSuccess?.()
						}}
					/>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<form.AppField
							name="email"
							validators={{
								onBlur: z.string().email({ message: 'Invalid email address' }),
							}}
						>
							{field => (
								<field.FormItem>
									<field.FormLabel>Email</field.FormLabel>
									<field.FormControl>
										<Input
											type="email"
											value={field.state.value}
											onChange={({ target }) =>
												field.handleChange(target.value)
											}
											onBlur={field.handleBlur}
										/>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						</form.AppField>

						<form.AppField
							name="password"
							validators={{
								onBlur: z.string().min(1, { message: 'Password is required' }),
							}}
						>
							{field => (
								<field.FormItem>
									<field.FormLabel>Password</field.FormLabel>
									<field.FormControl>
										<Input
											type="password"
											value={field.state.value}
											onChange={({ target }) =>
												field.handleChange(target.value)
											}
											onBlur={field.handleBlur}
										/>
									</field.FormControl>
									<field.FormMessage />
								</field.FormItem>
							)}
						</form.AppField>

						<Message>{error}</Message>

						<ModalFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<LoaderCircle className="animate-spin" />
										Signing in...
									</>
								) : (
									'Sign In'
								)}
							</Button>
						</ModalFooter>
					</form>
				</div>
			</form.AppForm>
		</Modal>
	)
}
