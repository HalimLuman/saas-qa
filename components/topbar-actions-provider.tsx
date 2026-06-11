'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface TopbarActionsCtx {
  actions: ReactNode
  setActions: (a: ReactNode) => void
}

const TopbarActionsContext = createContext<TopbarActionsCtx>({
  actions: null,
  setActions: () => {},
})

export function TopbarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null)
  const setActions = useCallback((a: ReactNode) => setActionsState(a), [])
  return (
    <TopbarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopbarActionsContext.Provider>
  )
}

export function useTopbarActions() {
  return useContext(TopbarActionsContext)
}
