import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { chatApi, aiApi } from '../api/client'
import { isSlashCommand } from '../utils/chatCommands'
import { CommandChips } from '../components/ui'
import { CitationBlock } from '../components/CitationBlock'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'
import { useWebSocket } from '../hooks/useWebSocket'

export default function Chat() {
  const { teacher, activeSession, messages, addMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  useWebSocket(activeSession?.id || null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !activeSession || !teacher) return
    const text = input.trim()
    setInput('')

    if (isSlashCommand(text)) {
      setAiLoading(true)
      try {
        if (text.startsWith('/generate ')) {
          await aiApi.generate(activeSession.id, teacher.id, teacher.name, text.slice(10))
        } else {
          await aiApi.command({
            sessionId: activeSession.id,
            senderId: teacher.id,
            senderName: teacher.name,
            role: 'teacher',
            input: text,
            sessionTopic: activeSession.topic
          })
        }
      } catch (e: any) {
        addMessage({ id: `err-${Date.now()}`, sessionId: activeSession.id, senderId: 'system', senderName: 'System', role: 'ai', content: `AI error: ${e.message}`, messageType: 'system', createdAt: new Date().toISOString() })
      }
      setAiLoading(false)
      return
    }

    // Regular chat message
    try {
      await chatApi.send(activeSession.id, teacher.id, teacher.name, 'teacher', text, 'chat')
    } catch (e) {}
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const noSession = !activeSession

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <StoryImage
            file="chat-listening-tree.png"
            shape="soft"
            rotate={-3}
            width={56}
            height={56}
            fallbackLabel="chat"
          />
          <div>
            <span className="kicker">CLASSROOM CONVERSATION</span>
            <h3 style={{ margin: 0 }}>Class Chat</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {noSession ? 'Start a session first' : `Session ${activeSession.code} · ${messages.length} messages`}
            </p>
          </div>
        </div>
        <CommandChips />
      </div>

      {/* Messages */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div className="empty-state empty-state-modern">
            <span className="empty-icon-bubble icon-bubble-primary">
              <Icon name="chat" size={32} />
            </span>
            <h3>No messages yet</h3>
            <p>Use /ask to query the AI, or /generate to create lesson content</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} teacherId={teacher?.id} />
        ))}
        {aiLoading && (
          <div style={styles.aiThinking}>
            <span className="spinner" /> EduLens AI is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          className="input"
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={noSession ? 'Start a session to chat…' : 'Type a message, /ask [question], or /generate [topic]'}
          disabled={noSession}
          rows={2}
        />
        <button className="btn btn-primary" onClick={send} disabled={noSession || !input.trim() || aiLoading} style={{ alignSelf: 'flex-end' }}>
          Send <Icon name="send" size={14} />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg, teacherId }: { msg: any; teacherId?: string }) {
  const isTeacher = msg.senderId === teacherId
  const isAI = msg.role === 'ai'
  const isSystem = msg.messageType === 'system'
  const isQuiz = msg.messageType === 'quiz' || (msg.messageType === 'system' && msg.content.includes('"quizId"'))

  if (isQuiz) {
    let quizData: any = null
    try {
      quizData = JSON.parse(msg.content)
    } catch {}

    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '8px 0' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '2px dashed var(--primary)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
          maxWidth: '80%',
          boxShadow: 'var(--shadow)'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', letterSpacing: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="quiz" size={16} /> ACTIVE QUIZ LAUNCHED
          </h4>
          <p style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 600 }}>Interactive Student Test is Live!</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            Total Questions: <strong>{quizData?.totalQuestions || 5}</strong>
          </p>
        </div>
      </div>
    )
  }

  if (isSystem) {
    return (
      <div style={styles.systemMsg}>{msg.content}</div>
    )
  }

  return (
    <div style={{ ...styles.msgRow, justifyContent: isTeacher ? 'flex-end' : 'flex-start' }}>
      {!isTeacher && (
        <div style={{ ...styles.avatar, background: isAI ? 'var(--primary)' : 'var(--bg-elevated)', color: isAI ? '#fff' : 'var(--text-primary)' }}>
          {isAI ? <Icon name="ai-bot" size={16} /> : msg.senderName[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '70%' }}>
        <div style={styles.msgMeta}>
          {!isTeacher && <span style={styles.senderName}>{msg.senderName}</span>}
          {msg.messageType === 'ask' && <span className="badge badge-primary" style={{ fontSize: 10 }}>/ask</span>}
          {msg.messageType === 'generate' && <span className="badge badge-primary" style={{ fontSize: 10 }}>/generate</span>}
        </div>
        <div style={{
          ...styles.bubble,
          background: isTeacher ? 'var(--primary)' : isAI ? 'var(--bg-elevated)' : 'var(--bg-card)',
          border: isAI ? '1px solid var(--primary-glow)' : '1px solid var(--border)',
          borderRadius: isTeacher ? '16px 4px 16px 16px' : '4px 16px 16px 16px'
        }}>
          <pre style={styles.msgText}>{msg.content}</pre>
          <CitationBlock citations={msg.citations} confidence={msg.confidence} confidenceNote={msg.confidenceNote} />
        </div>
        <div style={styles.timestamp}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-surface)', flexShrink: 0
  },
  messageList: {
    flex: 1, overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 12
  },
  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 0
  },
  textarea: { resize: 'none', flex: 1, minHeight: 54 },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0, color: '#fff'
  },
  msgMeta: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 },
  senderName: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  bubble: { padding: '10px 14px', borderRadius: 12 },
  msgText: {
    fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)',
    margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
  },
  timestamp: { fontSize: 10, color: 'var(--text-muted)', marginTop: 4 },
  systemMsg: {
    textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
    padding: '4px 12px', background: 'var(--bg-elevated)',
    borderRadius: 99, margin: '0 auto'
  },
  aiThinking: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: 'var(--text-muted)', padding: '8px 0'
  }
}
