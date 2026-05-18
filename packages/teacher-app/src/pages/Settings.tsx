import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { knowledgeApi } from '../api/client'

interface KnowledgeBase {
  id: string
  name: string
  chunk_count: number
  created_at: string
}

export default function Settings() {
  const { teacher } = useAppStore()
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [fetching, setFetching] = useState(true)

  const fetchKbs = async () => {
    if (!teacher) return
    setFetching(true)
    try {
      const data = await knowledgeApi.list(teacher.id)
      setKbs(data.knowledgeBases || [])
    } catch (e) {
      console.error(e)
    }
    setFetching(false)
  }

  useEffect(() => { fetchKbs() }, [teacher])

  const handleUpload = async () => {
    if (!file || !name.trim() || !teacher) return
    setLoading(true)
    setStatus('Processing PDF...')
    try {
      const data = await knowledgeApi.upload(teacher.id, name.trim(), file)
      setStatus(`✅ "${name}" uploaded — ${data.chunks} chunks indexed.`)
      setFile(null)
      setName('')
      fetchKbs()
    } catch (e: any) {
      setStatus(`❌ Error: ${e.response?.data?.error || e.message}`)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, kbName: string) => {
    if (!confirm(`Delete "${kbName}"?`)) return
    try {
      await knowledgeApi.delete(id)
      fetchKbs()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Knowledge Base</h2>
          <p>Upload PDF materials to ground AI answers in local, teacher-specific curriculum context.</p>
        </div>
      </div>

      {/* Upload card */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 32 }}>
        <h4 style={{ marginBottom: 16 }}>📤 Add New Material</h4>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Name (e.g. "History Ch. 3 — French Revolution")</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Descriptive name for this material"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">PDF File</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            disabled={loading}
            style={{ fontSize: 13, color: 'var(--text-primary)' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || !name.trim() || loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <span className="spinner" /> : '⚡ Upload & Index with Edge AI'}
        </button>

        {status && (
          <p style={{ marginTop: 12, fontSize: 13, color: status.startsWith('❌') ? 'var(--danger)' : 'var(--success)' }}>
            {status}
          </p>
        )}
      </div>

      {/* List of existing KBs */}
      <div className="card">
        <h4 style={{ marginBottom: 16 }}>📚 Stored Knowledge Bases ({kbs.length})</h4>

        {fetching ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : kbs.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-icon">📄</div>
            <p>No materials uploaded yet. Add your first PDF above!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kbs.map(kb => (
              <div key={kb.id} style={styles.kbRow}>
                <div style={styles.kbIcon}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.kbName}>{kb.name}</div>
                  <div style={styles.kbMeta}>
                    {kb.chunk_count} chunks · {new Date(kb.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(kb.id, kb.name)}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context note */}
      <div className="card" style={{ marginTop: 24, background: 'var(--info-dim, rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
        <h4 style={{ marginBottom: 8, color: 'var(--primary)' }}>💡 How it works</h4>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          When you select a Knowledge Base while starting a session, the AI will supplement its built-in
          NCERT knowledge with local context from your chosen PDF. This is ideal for injecting <strong>current
          events, custom lesson plans, local examples</strong>, or <strong>exam rubrics</strong> without
          needing to retrain the model.
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  kbRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px',
    background: 'var(--bg-elevated)', borderRadius: 10,
    border: '1px solid var(--border)'
  },
  kbIcon: { fontSize: 24, flexShrink: 0 },
  kbName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kbMeta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }
}
