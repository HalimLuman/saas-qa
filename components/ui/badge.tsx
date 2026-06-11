import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-50',
        secondary:   'border-transparent bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        destructive: 'border-transparent bg-red-600 text-white',
        outline:     'text-slate-600 border-slate-200 bg-transparent dark:text-zinc-400 dark:border-zinc-700',
        p0: 'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/60    dark:text-red-400    dark:border-red-900',
        p1: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900',
        p2: 'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/60   dark:text-blue-400   dark:border-blue-900',
        p3: 'bg-slate-100 text-slate-600  border-slate-200  dark:bg-zinc-800      dark:text-zinc-400   dark:border-zinc-700',
        critical: 'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/60    dark:text-red-400    dark:border-red-900',
        high:     'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900',
        medium:   'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/60   dark:text-blue-400   dark:border-blue-900',
        low:      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
