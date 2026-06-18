import { forwardRef, useState } from 'react'
import { cn } from './Button'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, hint, id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const isPassword = type === 'password'
    const [showPassword, setShowPassword] = useState(false)

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
        <div className="form-input-wrapper">
          <input
            id={inputId}
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'form-input',
              { 'form-input-error': !!error },
              { 'form-input-has-toggle': isPassword },
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="form-input-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="form-error-msg">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
