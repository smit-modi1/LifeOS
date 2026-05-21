import React, { useState, useRef, useEffect } from 'react'
import type { LifeOsData, ModuleKey } from '../types/lifeos'
import { useAssistant } from '../hooks/use-assistant'

interface AssistantSectionProps {
  data: LifeOsData
  updateModule: <K extends ModuleKey>(key: K, nextValue: LifeOsData[K]) => Promise<void>
}

export const AssistantSection: React.FC<AssistantSectionProps> = ({
  data,
  updateModule,
}) => {
  const {
    apiKey,
    messages,
    isThinking,
    saveApiKey,
    clearHistory,
    sendMessage,
  } = useAssistant(data, updateModule)

  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [tempKey, setTempKey] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isThinking, isOpen])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) return

    const textToSend = inputValue
    setInputValue('')
    await sendMessage(textToSend)
  }

  const handleQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt)
  }

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    saveApiKey(tempKey)
    setShowConfig(false)
  }

  const handleDeactivate = () => {
    saveApiKey('')
    setTempKey('')
  }

  const suggestionChips = [
    { label: '📊 Status Briefing', text: 'Give me my morning briefing and current status overview.' },
    { label: '🎯 Focus Area', text: 'What should I focus on right now? Check my pending tasks and habits.' },
    { label: '📝 Write Quick Note', text: 'Add a note titled "Idea Log" with content "Remember to check roadmap updates."' },
    { label: '🚀 Feature Pipeline', text: 'Add a roadmap task: "Implement local notifications for habits" with High priority.' },
    { label: '✅ Habit Check', text: 'Tick daily habit "Workout"' },
  ]

  return (
    <>
      {/* Floating Action Button (Arc Reactor style) */}
      <button
        className={`jarvis-fab ${isOpen ? 'jarvis-fab--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle JARVIS AI Assistant"
        type="button"
      >
        <div className="jarvis-fab__reactor">
          <div className="jarvis-fab__core" />
          <div className="jarvis-fab__ring" />
          <div className="jarvis-fab__particles">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <span className="jarvis-fab__spark">✦</span>
      </button>

      {/* Holographic Fullscreen Chat Overlay */}
      {isOpen && (
        <div className="jarvis-overlay" role="dialog" aria-modal="true">
          {/* Animated Matrix/Grid Background */}
          <div className="jarvis-overlay__grid" />
          <div className="jarvis-overlay__glow" />

          <div className="jarvis-card">
            {/* Holographic Header */}
            <header className="jarvis-header">
              <div className="jarvis-header__identity">
                <div className="jarvis-header__pulse-dot" />
                <div>
                  <h2 className="jarvis-header__title">J.A.R.V.I.S. Mainframe</h2>
                  <p className="jarvis-header__subtitle">
                    {apiKey ? '🟢 System Core Active' : '🟡 System Core Offline (Fallback Active)'}
                  </p>
                </div>
              </div>
              <div className="jarvis-header__controls">
                <button
                  className="jarvis-btn jarvis-btn--icon"
                  onClick={() => {
                    setTempKey(apiKey)
                    setShowConfig(!showConfig)
                  }}
                  title="Configure Mainframe Core"
                  type="button"
                >
                  ⚙️
                </button>
                <button
                  className="jarvis-btn jarvis-btn--icon"
                  onClick={clearHistory}
                  title="Wipe Memory Logs"
                  type="button"
                >
                  🧹
                </button>
                <button
                  className="jarvis-btn jarvis-btn--close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Shutdown Interface"
                  type="button"
                >
                  ✕
                </button>
              </div>
            </header>

            {/* Core Activation Panel (API Key Settings) */}
            {showConfig && (
              <div className="jarvis-config-panel">
                <form onSubmit={handleSaveKey} className="jarvis-config-form">
                  <h3>Activate Cognitive Engine</h3>
                  <p>
                    Provide a Google Gemini API Key to unlock advanced reasoning, summary briefs, and live database automation. Get a free key at{' '}
                    <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">
                      aistudio.google.com
                    </a>.
                  </p>
                  <div className="jarvis-input-group">
                    <input
                      type="password"
                      className="jarvis-input"
                      placeholder="Enter VITE_GEMINI_API_KEY..."
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                    />
                    <button type="submit" className="jarvis-btn jarvis-btn--primary">
                      Save
                    </button>
                  </div>
                  {apiKey && (
                    <button
                      type="button"
                      className="jarvis-btn jarvis-btn--danger"
                      onClick={handleDeactivate}
                      style={{ marginTop: '8px', width: '100%' }}
                    >
                      Deactivate Core Key
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Messages Display Area */}
            <div className="jarvis-messages-container">
              {/* API Key Callout (if missing and no config open) */}
              {!apiKey && !showConfig && (
                <div className="jarvis-notice-card">
                  <div className="jarvis-notice-card__badge">✦ ENGINE CORE STANDBY</div>
                  <p>
                    JARVIS is running in local-mock backup protocols. Connect my neural API core using a Gemini key to enable full natural language controls and conversational intelligence.
                  </p>
                  <button
                    className="jarvis-btn jarvis-btn--outline"
                    onClick={() => {
                      setTempKey(apiKey)
                      setShowConfig(true)
                    }}
                    type="button"
                  >
                    Activate Neural Core
                  </button>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`jarvis-message-wrapper jarvis-message-wrapper--${msg.role}`}
                >
                  <div className="jarvis-message-avatar">
                    {msg.role === 'user' ? '👤' : '✦'}
                  </div>
                  <div className="jarvis-message-bubble">
                    <div className="jarvis-message-text">{msg.content}</div>
                    <span className="jarvis-message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="jarvis-message-wrapper jarvis-message-wrapper--model">
                  <div className="jarvis-message-avatar jarvis-message-avatar--thinking">✦</div>
                  <div className="jarvis-message-bubble jarvis-message-bubble--thinking">
                    <div className="jarvis-thinking">
                      <div className="jarvis-thinking__waveform">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="jarvis-thinking__text">JARVIS is calculating...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="jarvis-suggestions">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  className="jarvis-suggestion-chip"
                  onClick={() => handleQuickPrompt(chip.text)}
                  disabled={isThinking}
                  type="button"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleSend} className="jarvis-input-form">
              <input
                type="text"
                className="jarvis-chat-input"
                placeholder="Instruct JARVIS mainframe..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isThinking}
              />
              <button
                type="submit"
                className="jarvis-send-btn"
                disabled={isThinking || !inputValue.trim()}
                aria-label="Send directive"
              >
                ▲
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
