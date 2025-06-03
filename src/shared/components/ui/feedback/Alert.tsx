import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/shared/lib/utils'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          {
            'bg-white text-gray-900': variant === 'default',
            'bg-red-50 text-red-900 border-red-200': variant === 'destructive',
            'bg-green-50 text-green-900 border-green-200': variant === 'success',
            'bg-yellow-50 text-yellow-900 border-yellow-200': variant === 'warning',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={cn('mb-1 font-medium leading-none tracking-tight', className)}
        {...props}
      />
    )
  }
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-sm [&_p]:leading-relaxed', className)}
        {...props}
      />
    )
  }
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription } 