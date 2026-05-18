import React, { useRef, useState, useEffect } from 'react'
import jsQR from 'jsqr'
import { Icon } from './Icon'

interface EduLensReport {
  type: string
  v: number
  student: { id: string; name: string }
  session: { code: string; topic: string }
  date: string
  quiz: { score: number; total: number; percentage: number }
  weakTopics: string[]
  strongTopics: string[]
  topicBreakdown: Record<string, number>
  homework: { conceptRecap: string; revisionCount: number; followUpCount: number }
}

interface Props {
  onScan: (report: EduLensReport) => void
  onClose: () => void
}

export default function StudentQRScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        rafRef.current = requestAnimationFrame(tick)
      }
    } catch (e: any) {
      setError(`Camera error: ${e.message || 'Permission denied'}`)
    }
  }

  const tick = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    const ctx = canvas.getContext('2d')!
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
    if (code?.data) {
      try {
        const parsed = JSON.parse(code.data)
        if (parsed.type === 'edulens_report') {
          streamRef.current?.getTracks().forEach(t => t.stop())
          cancelAnimationFrame(rafRef.current)
          onScan(parsed)
          return
        }
      } catch {}
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="mobile" size={20} /> Scan Student Report QR
          </h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Point the camera at a student's EduLens Report QR code.
        </p>
        {error ? (
          <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, color: 'var(--text-danger)', fontSize: 13 }}>
            {error}
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {scanning && (
              <div style={crosshairStyle}>
                <div style={crosshairInner} />
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
          Student must show the QR from their Report tab
        </p>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const modalStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  borderRadius: 16, padding: 24,
  width: 440, maxWidth: '95vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
}
const crosshairStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  pointerEvents: 'none',
}
const crosshairInner: React.CSSProperties = {
  width: 200, height: 200,
  border: '3px solid rgba(255,255,255,0.8)',
  borderRadius: 12,
}
