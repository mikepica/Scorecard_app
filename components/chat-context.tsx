"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export type ContextSelection = {
  allSelected: boolean
  pillars: string[]
  categories: string[]
  goals: string[]
  programs: string[]
}

type ChatContextValue = {
  currentThreadId: string | null
  setCurrentThreadId: (id: string | null) => void
  contextSelection: ContextSelection
  setContextSelection: (sel: ContextSelection) => void
  saveSelection: (sel: ContextSelection) => Promise<void>
  pendingSelection: ContextSelection | null
  applyPendingSelection: (threadId: string) => Promise<void>
}

const defaultSelection: ContextSelection = {
  allSelected: true,
  pillars: [],
  categories: [],
  goals: [],
  programs: [],
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatContextProvider({ children }: { children: React.ReactNode }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [contextSelection, setContextSelection] = useState<ContextSelection>(defaultSelection)
  const [pendingSelection, setPendingSelection] = useState<ContextSelection | null>(null)

  const saveSelection = useCallback(async (sel: ContextSelection) => {
    setContextSelection(sel)
    if (currentThreadId) {
      try {
        await fetch(`/api/chat/threads/${currentThreadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contextSelection: sel })
        })
        setPendingSelection(null)
      } catch (e) {
        // If API fails, keep it as pending
        setPendingSelection(sel)
        console.error('Failed saving context selection to thread', e)
      }
    } else {
      setPendingSelection(sel)
    }
  }, [currentThreadId])

  const applyPendingSelection = useCallback(async (threadId: string) => {
    if (!pendingSelection) return
    try {
      await fetch(`/api/chat/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextSelection: pendingSelection })
      })
      setCurrentThreadId(threadId)
      setContextSelection(pendingSelection)
      setPendingSelection(null)
    } catch (e) {
      console.error('Failed applying pending selection to new thread', e)
    }
  }, [pendingSelection])

  return (
    <ChatContext.Provider value={{
      currentThreadId,
      setCurrentThreadId,
      contextSelection,
      setContextSelection,
      saveSelection,
      pendingSelection,
      applyPendingSelection,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatContextProvider')
  return ctx
}

