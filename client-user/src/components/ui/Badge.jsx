// src/components/ui/Badge.jsx
import { cn } from '@/lib/utils'

export default function Badge({
  children,
  color,
  variant = 'filled',
  size = 'sm',
  className,
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const dynamicStyle = color
    ? {
        backgroundColor: variant === 'filled' ? `${color}15` : 'transparent',
        color: color,
        border: variant === 'outline' ? `1.5px solid ${color}` : 'none',
      }
    : {}

  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        !color && 'bg-primary-50 text-primary-700',
        className
      )}
      style={dynamicStyle}
    >
      {children}
    </span>
  )
}