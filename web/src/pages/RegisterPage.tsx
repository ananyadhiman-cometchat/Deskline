import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterFormValues } from '@/lib/schemas'
import { useRegister } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function RegisterPage() {
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data)
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-navy)] font-heading">
          Request Clearance
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Register for standard employee access.
        </p>
      </div>

      {registerMutation.isError && <ErrorMessage error={registerMutation.error} title="Registration Failed" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          {...register('name')}
          error={errors.name?.message}
          required
        />

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
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
          required
          hint="Minimum 8 characters."
        />

        <Select
          label="Department"
          {...register('department')}
          error={errors.department?.message}
          required
          options={[
            { value: 'IT', label: 'IT' },
            { value: 'HR', label: 'HR' },
            { value: 'General', label: 'General' },
          ]}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          tactical
          isLoading={registerMutation.isPending}
        >
          Submit Registration
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-[var(--color-muted)]">
        Already have clearance?{' '}
        <Link to="/login" className="font-semibold text-[var(--color-brand-red)] hover:underline">
          Log In
        </Link>
      </div>
    </>
  )
}
