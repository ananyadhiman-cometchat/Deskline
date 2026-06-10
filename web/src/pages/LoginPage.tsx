import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { loginSchema, type LoginFormValues } from '@/lib/schemas'
import { useLogin } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function LoginPage() {
  const login = useLogin()
  const location = useLocation()
  const registered = location.state?.registered

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data)
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-navy)] font-heading">
          System Access
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Authenticate to access the operational support matrix.
        </p>
      </div>

      {registered && (
        <div className="mb-6 border-l-4 border-[#10b981] bg-[#10b981]/10 p-4 text-sm text-[#10b981]">
          Registration successful. Please log in with your credentials.
        </div>
      )}

      {login.isError && <ErrorMessage error={login.error} title="Authentication Failed" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
          required
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          tactical
          isLoading={login.isPending}
        >
          Initialise Protocol
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-[var(--color-muted)]">
        Do not have an access code?{' '}
        <Link to="/register" className="font-semibold text-[var(--color-brand-red)] hover:underline">
          Request Clearance
        </Link>
      </div>
    </>
  )
}
