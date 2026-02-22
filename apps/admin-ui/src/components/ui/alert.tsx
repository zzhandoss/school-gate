import * as React from 'react'

import { cn } from '@/lib/utils'

export function Alert({
  className,
  role,
  'aria-live': ariaLive,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const resolvedRole = role ?? 'alert'
  const resolvedAriaLive =
    ariaLive ?? (resolvedRole === 'status' ? 'polite' : undefined)

  return (
    <div
      role={resolvedRole}
      aria-live={resolvedAriaLive}
      className={cn(
        'relative w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground',
        className
      )}
      {...props}
    />
  )
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-medium leading-none', className)} {...props} />
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
