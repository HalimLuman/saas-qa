'use client'

import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'destructive'

interface ToastState {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  open: boolean
}

type ToastAction =
  | { type: 'ADD'; toast: ToastState }
  | { type: 'DISMISS'; id: string }
  | { type: 'REMOVE'; id: string }

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function reducer(state: ToastState[], action: ToastAction): ToastState[] {
  switch (action.type) {
    case 'ADD':
      return [action.toast, ...state].slice(0, 5)
    case 'DISMISS':
      return state.map((t) => (t.id === action.id ? { ...t, open: false } : t))
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id)
  }
}

type Listener = (state: ToastState[]) => void
const listeners: Listener[] = []
let memoryState: ToastState[] = []

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<ToastState, 'id' | 'open'>) {
  const id = genId()
  dispatch({ type: 'ADD', toast: { ...props, id, open: true } })

  const duration = props.duration ?? 4000
  setTimeout(() => {
    dispatch({ type: 'DISMISS', id })
    // remove after exit animation completes
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 350)
  }, duration)

  return id
}

export function useToast() {
  const [state, setState] = React.useState<ToastState[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const i = listeners.indexOf(setState)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss: (id: string) => {
      dispatch({ type: 'DISMISS', id })
      setTimeout(() => dispatch({ type: 'REMOVE', id }), 350)
    },
  }
}
