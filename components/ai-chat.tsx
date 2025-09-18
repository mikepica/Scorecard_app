"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, ChevronDown, Edit3, Trash2, Plus, CheckSquare } from "lucide-react"
import { Overlay } from "./overlay"
import type { ScoreCardData } from "@/types/scorecard"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { useChatContext } from "@/components/chat-context"

type Message = {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

type ChatThread = {
  id: string
  name: string
  created_at: string
  updated_at: string
  message_count?: number
  last_message_at?: string
  context_selection?: ContextSelection
}

type AIChatProps = {
  isOpen: boolean
  onClose: () => void
  context: ScoreCardData
  isReprioritizationMode?: boolean
  onReset?: () => void
  onOpenContextSelection?: () => void
  isSelectingContext?: boolean
  onCancelContextSelection?: () => void
  onSaveContextSelection?: () => void
}

export function AIChat({ isOpen, onClose, context, isReprioritizationMode = false, onReset, onOpenContextSelection, isSelectingContext, onCancelContextSelection, onSaveContextSelection }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [showThreadDropdown, setShowThreadDropdown] = useState(false)
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingThreadName, setEditingThreadName] = useState("")
  const chat = useChatContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load threads when chat opens
  useEffect(() => {
    if (isOpen) {
      loadThreads()
    }
  }, [isOpen])

  // Initialize chat with context when no thread selected
  useEffect(() => {
    if (isOpen && !currentThreadId && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "Hello! I have access to your scorecard data and can help you analyze it. How can I assist you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, currentThreadId, messages.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowThreadDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Load threads
  const loadThreads = async () => {
    try {
      const response = await fetch('/api/chat/threads')
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads)
      }
    } catch (error) {
      console.error('Error loading threads:', error)
    }
  }

  // Load thread messages
  const loadThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        const threadMessages = data.messages.map((msg: { id: string; text: string; sender: string; timestamp: string }) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(threadMessages)
        setCurrentThreadId(threadId)
        chat.setCurrentThreadId(threadId)
        if (data.thread && data.thread.context_selection) {
          chat.setContextSelection(data.thread.context_selection as ContextSelection)
        } else {
          chat.setContextSelection({ allSelected: true, pillars: [], categories: [], goals: [], programs: [] })
        }
      }
    } catch (error) {
      console.error('Error loading thread:', error)
    }
  }

  // Create new thread
  const createNewThread = async () => {
    setCurrentThreadId(null)
    setMessages([])
    setShowThreadDropdown(false)
    // New threads default handled by chat context (all selected)
    chat.setContextSelection({ allSelected: true, pillars: [], categories: [], goals: [], programs: [] })
  }

  // Save message to current thread
  const saveMessageToThread = async (threadId: string, text: string, sender: string) => {
    try {
      await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender })
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  // Generate thread name
  const generateThreadName = async (messages: Message[]) => {
    try {
      const response = await fetch('/api/chat/threads/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
      if (response.ok) {
        const data = await response.json()
        return data.name
      }
    } catch (error) {
      console.error('Error generating thread name:', error)
    }
    return 'New Chat'
  }

  // Reset chat
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setMessages([])
    setInput("")
    setIsLoading(false)
    setCurrentThreadId(null)
    // Notify parent component of reset
    if (onReset) {
      onReset()
    }
  }

  // Delete thread
  const deleteThread = async (threadId: string) => {
    if (confirm('Are you sure you want to delete this chat thread?')) {
      try {
        await fetch(`/api/chat/threads?id=${threadId}`, { method: 'DELETE' })
        if (currentThreadId === threadId) {
          handleReset()
        }
        loadThreads()
      } catch (error) {
        console.error('Error deleting thread:', error)
      }
    }
  }

  // Rename thread
  const startRenaming = (thread: ChatThread) => {
    setEditingThreadId(thread.id)
    setEditingThreadName(thread.name)
  }

  const saveThreadName = async () => {
    if (!editingThreadId || !editingThreadName.trim()) return
    
    try {
      await fetch(`/api/chat/threads/${editingThreadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingThreadName.trim() })
      })
      setEditingThreadId(null)
      setEditingThreadName("")
      loadThreads()
    } catch (error) {
      console.error('Error renaming thread:', error)
    }
  }

  const cancelRenaming = () => {
    setEditingThreadId(null)
    setEditingThreadName("")
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    const currentInput = input
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Handle thread creation and saving
    let threadId = currentThreadId
    if (!threadId) {
      // Create new thread if none selected
      try {
        const threadName = await generateThreadName([userMessage])
        const response = await fetch('/api/chat/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: threadName })
        })
        if (response.ok) {
          const data = await response.json()
          threadId = data.thread.id
          setCurrentThreadId(threadId)
          chat.setCurrentThreadId(threadId)
          if (threadId) {
            await chat.applyPendingSelection(threadId)
          }
          loadThreads()
        }
      } catch (error) {
        console.error('Error creating thread:', error)
      }
    }

    // Save user message to thread
    if (threadId) {
      await saveMessageToThread(threadId, currentInput, 'user')
    }

    try {
      // Prepare effective context based on saved selection for the thread
      const effectiveSelection = chat.contextSelection
      const effectiveContext = filterContextBySelection(context, effectiveSelection)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: input
            }
          ],
          context: effectiveContext
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      
      // Save AI response to thread
      if (threadId) {
        await saveMessageToThread(threadId, data.response, 'ai')
        loadThreads() // Refresh thread list to update last message time
      }
    } catch (error: unknown) {
      // Only show error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I encountered an error. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        
        // Save error message to thread
        if (threadId) {
          await saveMessageToThread(threadId, errorMessage.text, 'ai')
        }
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isOpen) return null

  return (
    <>
      <Overlay isVisible={isOpen} onClick={() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }
        onClose()
      }} />
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[768px] bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b bg-purple-600 text-white">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">AI Chat</h2>
              {isReprioritizationMode && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Reprioritization Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onOpenContextSelection && (
                <button
                  onClick={onOpenContextSelection}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-md text-sm"
                  title="Select Context"
                >
                  <CheckSquare size={16} />
                  <span>Select Context</span>
                </button>
              )}
              {onOpenContextSelection && !chat.contextSelection.allSelected && (
                <span className="inline-block text-xs bg-black/20 px-2 py-1 rounded">Custom context</span>
              )}
              <button 
                onClick={handleReset} 
                className="p-1 rounded-full hover:bg-purple-700"
                title="New Chat"
              >
                <Plus size={20} />
              </button>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-700">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Context selection is controlled on main page. */}
          
          {/* Thread Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowThreadDropdown(!showThreadDropdown)}
              className="w-full flex items-center justify-between bg-purple-500 hover:bg-purple-400 px-3 py-2 rounded-md text-sm"
            >
              <span className="truncate">
                {currentThreadId 
                  ? threads.find(t => t.id === currentThreadId)?.name || 'Select Thread'
                  : 'New Chat'
                }
              </span>
              <ChevronDown size={16} className={`transition-transform ${showThreadDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showThreadDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                <button
                  onClick={createNewThread}
                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 border-b border-gray-200 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>New Chat</span>
                </button>
                
                {threads.map((thread) => (
                  <div key={thread.id} className="border-b border-gray-100 last:border-b-0">
                    {editingThreadId === thread.id ? (
                      <div className="p-2">
                        <input
                          type="text"
                          value={editingThreadName}
                          onChange={(e) => setEditingThreadName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveThreadName()
                            if (e.key === 'Escape') cancelRenaming()
                          }}
                          onBlur={saveThreadName}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center group">
                        <button
                          onClick={() => {
                            loadThread(thread.id)
                            setShowThreadDropdown(false)
                          }}
                          className="flex-1 px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
                        >
                          <div className="truncate text-sm font-medium">{thread.name}</div>
                          <div className="text-xs text-gray-500">
                            {thread.message_count} messages • {new Date(thread.last_message_at || thread.updated_at).toLocaleDateString()}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startRenaming(thread)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Rename"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteThread(thread.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {threads.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No chat threads yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selection Mode Bar (mirrors main page) */}
        {isSelectingContext && (
          <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-medium">Context Selection Mode — tick rows to include in AI context</div>
            <div className="flex items-center gap-2">
              {onCancelContextSelection && (
                <button onClick={onCancelContextSelection} className="px-3 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
              )}
              {onSaveContextSelection && (
                <button onClick={onSaveContextSelection} className="px-3 py-2 text-sm rounded bg-purple-600 text-white hover:bg-purple-700">Add selections to context</button>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.sender === "ai" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

        {/* Input */}
        <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
      </div>
    </>
  )
}

// Types and helpers for context selection
type ContextSelection = {
  allSelected: boolean
  pillars: string[]
  categories: string[]
  goals: string[]
  programs: string[]
}

function filterContextBySelection(context: ScoreCardData, sel: ContextSelection): ScoreCardData {
  if (sel.allSelected) return context

  const sets = {
    pillars: new Set(sel.pillars || []),
    categories: new Set(sel.categories || []),
    goals: new Set(sel.goals || []),
    programs: new Set(sel.programs || []),
  }

  // Filter based on selections - include items that are explicitly selected
  // or whose parents are selected (for hierarchical inclusion)
  const filteredPillars = (context.pillars || []).filter(p => sets.pillars.has(p.id)).map(p => ({
    ...p,
    categories: (p.categories || []).filter(c => sets.categories.has(c.id)).map(c => ({
      ...c,
      goals: (c.goals || []).filter(g => sets.goals.has(g.id)).map(g => ({
        ...g,
        programs: (g.programs || []).filter(pr => sets.programs.has(pr.id))
      }))
    }))
  }))

  return { pillars: filteredPillars }
}
 
