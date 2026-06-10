import { forwardRef } from 'react'
import { cn } from './Button'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, required, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="form-group">
        {label && (
          <label 
            htmlFor={textareaId} 
            className={cn('form-label', { 'form-label-required': required })}
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'form-textarea',
            { 'form-textarea-error': !!error },
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
Textarea.displayName = 'Textarea'
