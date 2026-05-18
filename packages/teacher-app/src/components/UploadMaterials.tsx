import React, { useState } from 'react'
import { baseUrl } from '../api/client'

export default function UploadMaterials() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setStatus('Uploading...')
    
    const formData = new FormData()
    formData.append('document', file)
    
    try {
      const res = await fetch(`${baseUrl}/ai/upload-materials`, {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (data.success) {
        setStatus(`✅ Processed ${data.chunks} chunks. AI is now grounded on this document.`)
        setFile(null)
      } else {
        setStatus(`❌ Error: ${data.error}`)
      }
    } catch (e: any) {
      setStatus(`❌ Error: ${e.message}`)
    }
    setLoading(false)
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      await fetch(`${baseUrl}/ai/clear-materials`, { method: 'POST' })
      setStatus('Cleared context.')
    } catch (e: any) {
      setStatus(`❌ Error: ${e.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
      <h4 style={{ marginBottom: 12 }}>📚 RAG Materials</h4>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Upload a PDF to ground the AI's answers to your specific curriculum.
      </p>
      
      <div className="flex gap-2 items-center" style={{ marginBottom: 12 }}>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={e => setFile(e.target.files?.[0] || null)} 
          disabled={loading}
          style={{ fontSize: 13 }}
        />
        <button 
          className="btn btn-primary btn-sm" 
          onClick={handleUpload} 
          disabled={!file || loading}
        >
          {loading ? 'Processing...' : 'Upload & Ground AI'}
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <button className="btn btn-ghost btn-sm" onClick={handleClear} disabled={loading}>
          Clear Context
        </button>
      </div>
      
      {status && <div style={{ marginTop: 12, fontSize: 13, color: status.startsWith('❌') ? 'var(--danger)' : 'var(--success)' }}>{status}</div>}
    </div>
  )
}
