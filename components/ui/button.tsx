'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm ring-offset-white focus-visible:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:ring-offset-zinc-900 dark:focus-visible:ring-zinc-300',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm ring-offset-white focus-visible:ring-red-500 dark:ring-offset-zinc-900',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm ring-offset-white focus-visible:ring-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:hover:border-zinc-500 dark:ring-offset-zinc-900 dark:focus-visible:ring-zinc-400',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-sm ring-offset-white focus-visible:ring-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:ring-offset-zinc-900 dark:focus-visible:ring-zinc-400',
        ghost:
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900 ring-offset-white focus-visible:ring-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:ring-offset-zinc-900 dark:focus-visible:ring-zinc-400',
        link:
          'text-zinc-900 underline-offset-4 hover:underline hover:text-zinc-700 ring-offset-white focus-visible:ring-zinc-900 dark:text-zinc-200 dark:hover:text-white dark:focus-visible:ring-zinc-400',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-lg px-6',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
