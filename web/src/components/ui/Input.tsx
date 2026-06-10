import { forwardRef } from 'react'
import { cn } from './Button'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="form-group">
        {label && (
          <label 
            htmlFor={inputId} 
            className={cn('form-label', { 'form-label-required': required })}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'form-input',
            { 'form-input-error': !!error },
            className
          )}
          {...props}
        />
        {error && <p className="form-error-msg">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
