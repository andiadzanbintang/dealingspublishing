// src/components/ui/Button.jsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary:
    'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300',
  outline:
    'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100',
  ghost:
    'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800',
  white:
    'bg-white text-neutral-800 hover:bg-neutral-50 shadow-sm',
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-xl',
}

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      icon: Icon,
      iconPosition = 'right',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {Icon && iconPosition === 'left' && !isLoading && (
          <Icon className="w-4 h-4" />
        )}
        {children}
        {Icon && iconPosition === 'right' && !isLoading && (
          <Icon className="w-4 h-4" />
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button