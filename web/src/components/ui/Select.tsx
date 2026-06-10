import { forwardRef } from 'react'
import { cn } from './Button'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="form-group">
        {label && (
          <label 
            htmlFor={selectId} 
            className={cn('form-label', { 'form-label-required': required })}
          >
            {label}
          </label>
        )}
        <div className="select-wrapper">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'form-select',
              { 'form-select-error': !!error },
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="form-error-msg">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
