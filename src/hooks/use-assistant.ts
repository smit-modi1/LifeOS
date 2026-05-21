import { useState, useEffect } from 'react'
import type { AssistantMessage } from '../types/assistant'
import type { LifeOsData, ModuleKey } from '../types/lifeos'
import { sendJarvisMessage } from '../lib/assistant'

const STORAGE_KEY_API_KEY = 'jarvis-gemini-api-key'
const STORAGE_KEY_HISTORY = 'jarvis-chat-history'

const JARVIS_GREETINGS = [
  "Good day, Sir. All systems are operational. How may I be of assistance?",
  "At your service, Sir. Ready to manage the Command Centre.",
  "System diagnostics nominal. What is our objective for today, Sir?",
  "Core systems active, Sir. Ready to catalog your progress.",
]

export const useAssistant = (
  data: LifeOsData,
  updateModule: <K extends ModuleKey>(key: K, nextValue: LifeOsData[K]) => Promise<void>
) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
    if (envKey) return envKey
    return localStorage.getItem(STORAGE_KEY_API_KEY) || ''
  })

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (_) {
        // Fall back to default greeting
      }
    }
    
    // Initial welcome message
    const greeting = JARVIS_GREETINGS[Math.floor(Math.random() * JARVIS_GREETINGS.length)]
    return [
      {
        id: 'initial-greeting',
        role: 'model',
        content: greeting,
        timestamp: new Date().toISOString(),
      },
    ]
  })

  const [isThinking, setIsThinking] = useState(false)

  // Persist history when updated
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(messages))
  }, [messages])

  // Save new API Key
  const saveApiKey = (key: string) => {
    const cleanKey = key.trim()
    setApiKey(cleanKey)
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_API_KEY, cleanKey)
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY)
    }
  }

  // Clear chat history
  const clearHistory = () => {
    const greeting = JARVIS_GREETINGS[Math.floor(Math.random() * JARVIS_GREETINGS.length)]
    const initial: AssistantMessage[] = [
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        content: greeting,
        timestamp: new Date().toISOString(),
      },
    ]
    setMessages(initial)
  }

  // Send message handler
  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: AssistantMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add user message immediately to the screen
    setMessages(prev => [...prev, userMessage])
    setIsThinking(true)

    try {
      // Get AI response and any direct data mutations
      const result = await sendJarvisMessage(
        messages,
        userMessage.content,
        data,
        apiKey
      )

      // Apply any mutations returned by the tool executor
      if (result.mutations && result.mutations.length > 0) {
        for (const m of result.mutations) {
          console.log(`[useAssistant] Mutating module "${m.moduleKey}" with new state:`, m.nextValue)
          await updateModule(m.moduleKey, m.nextValue)
        }
      }

      const modelMessage: AssistantMessage = {
        id: `msg-model-${Date.now()}`,
        role: 'model',
        content: result.text,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, modelMessage])
    } catch (err: any) {
      console.error('[useAssistant] Send error:', err)
      const errorMessage: AssistantMessage = {
        id: `msg-error-${Date.now()}`,
        role: 'model',
        content: `My apologies, Sir. It seems an unexpected core error has occurred: ${err.message}.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  return {
    apiKey,
    messages,
    isThinking,
    saveApiKey,
    clearHistory,
    sendMessage,
  }
}
