export interface AssistantMessage {
  id: string
  role: 'user' | 'model' | 'system'
  content: string
  timestamp: string
  isToolCall?: boolean
}

export interface AssistantSession {
  messages: AssistantMessage[]
  geminiApiKey: string | null
}
