import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { knowledgeApi, syncApi } from '../api/client'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

interface KnowledgeBase {
  id: string
  name: string
  chunk_count: number
  created_at: string
}

export default function Settings() {
  const { teacher, activeSession } = useAppStore()
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [fetching, setFetching] = useState(true)
  const [fileError, setFileError] = useState('')

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

  const onFilePick = (f: File | null) => {
    setFileError('')
    if (!f) { setFile(null); return }
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Only PDF files are supported')
      setFile(null)
      return
    }
    if (f.size > 25 * 1024 * 1024) {
      setFileError('File must be under 25 MB')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file || !name.trim() || !teacher) return
    setLoading(true)
    setUploadProgress(5)
    setStatus('Uploading PDF…')
    const tick = setInterval(() => {
      setUploadProgress(p => (p < 90 ? p + 8 : p))
    }, 400)
    try {
      const data = await knowledgeApi.upload(teacher.id, name.trim(), file)
      setUploadProgress(100)
      setStatus(`✅ "${name}" uploaded — ${data.chunks} chunks indexed · RAG ready.`)
      setFile(null)
      setName('')
      fetchKbs()
    } catch (e: any) {
      setStatus(`❌ Error: ${e.response?.data?.error || e.message}`)
      setUploadProgress(0)
    }
    clearInterval(tick)
    setLoading(false)
    setTimeout(() => setUploadProgress(0), 1500)
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
      <div className="story-hero">
        <div className="story-hero-text">
          <span className="kicker">THE LIBRARY SHELF</span>
          <h2 style={{ margin: '4px 0' }}>Knowledge Base</h2>
          <p className="subhead">Upload PDF materials to ground AI answers in local, teacher-specific curriculum context.</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="settings-library-shelf.png"
            shape="puff"
            rotate={-3}
            width={160}
            height={160}
            fallbackLabel="settings · library shelf"
          />
        </div>
      </div>

      {/* Upload card */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 32 }}>
        <h4 style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="upload" size={16} /> Add New Material
        </h4>

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
            onChange={e => onFilePick(e.target.files?.[0] || null)}
            disabled={loading}
            style={{ fontSize: 13, color: 'var(--text-primary)' }}
          />
          {file && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB · PDF validated
            </p>
          )}
          {fileError && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{fileError}</p>}
        </div>

        {loading && uploadProgress > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{uploadProgress}% — chunking & indexing…</p>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || !name.trim() || loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <span className="spinner" /> : <><Icon name="bolt" size={14} /> Upload & Index with Edge AI</>}
        </button>

        {status && (
          <p style={{ marginTop: 12, fontSize: 13, color: status.startsWith('❌') ? 'var(--danger)' : 'var(--success)' }}>
            {status}
          </p>
        )}
      </div>

      {/* List of existing KBs */}
      <div className="card">
        <h4 style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="homework" size={16} /> Stored Knowledge Bases ({kbs.length})
        </h4>

        {fetching ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : kbs.length === 0 ? (
          <div className="empty-state empty-state-modern" style={{ padding: '32px 0' }}>
            <span className="empty-icon-bubble icon-bubble-muted"><Icon name="document" size={28} /></span>
            <p>No materials uploaded yet. Add your first PDF above!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kbs.map(kb => (
              <div key={kb.id} style={styles.kbRow}>
                <div style={styles.kbIcon}><Icon name="document" size={22} color="var(--primary)" /></div>
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
                  <Icon name="trash" size={14} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="cloud" size={16} /> Cloud Sync
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Bundles save to <code>data/cloud/</code> locally. Set <code>SYNC_CLOUD_URL</code> in .env for remote upload.
        </p>
        {teacher && activeSession && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                setStatus('Uploading to cloud…')
                try {
                  const r = await syncApi.exportBundle(activeSession.id, teacher.id)
                  setStatus(`✅ Cloud: ${r.cloud?.remote ? 'remote OK' : 'local mirror'} · ${r.filename}`)
                } catch (e: any) {
                  setStatus(`❌ ${e.message}`)
                }
              }}
            >
              Push session to cloud
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                setStatus('Pulling from cloud…')
                try {
                  const r = await syncApi.pullCloud(teacher.id, activeSession.id)
                  setStatus(`✅ Restored ${JSON.stringify(r.restored)}`)
                } catch (e: any) {
                  setStatus(`❌ ${e.message}`)
                }
              }}
            >
              Pull from cloud
            </button>
          </div>
        )}
      </div>

      {/* Context note */}
      <div className="card" style={{ marginTop: 24, background: 'var(--success-dim)', border: '1px solid var(--success)' }}>
        <h4 style={{ marginBottom: 8, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="lightbulb" size={16} /> How it works
        </h4>
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
