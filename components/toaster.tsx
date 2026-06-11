'use client'

import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  destructive: <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
  default: <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant = 'default', open, duration, ...props }) => (
        <Toast
          key={id}
          open={open}
          variant={variant}
          onOpenChange={(isOpen) => { if (!isOpen) dismiss(id) }}
          {...props}
        >
          {ICONS[variant]}
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
