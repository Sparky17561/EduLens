import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useReport } from '../hooks/useReport'
import { aiApi } from '../api/client'
import PerformanceHeatmap from '../components/PerformanceHeatmap'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { LoadingBlock } from '../components/ui'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

export default function Analytics() {
  const { activeSession, students } = useAppStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const { report, loading, refresh } = useReport(activeSession?.id || null, refreshKey)
  const [misconceptions, setMisconceptions] = useState<any[]>([])

  useEffect(() => {
    const handler = () => { setRefreshKey(k => k + 1); refresh() }
    window.addEventListener('edulens:analytics_updated', handler)
    return () => window.removeEventListener('edulens:analytics_updated', handler)
  }, [refresh])

  useEffect(() => {
    if (!activeSession) return
    aiApi.misconceptions(activeSession.id).then(d => setMisconceptions(d.misconceptions || [])).catch(() => {})
  }, [activeSession?.id, refreshKey])

  const analytics = report?.analytics
  const studentReports = report?.studentReports || []
  const chartData = analytics?.topicBreakdown
    ? Object.entries(analytics.topicBreakdown).map(([topic, avg]) => ({ topic, avg: Math.round(avg as number) }))
    : []
  const weakTopics: string[] = analytics?.weakTopics || []
  const heatmapStudents = studentReports.map((r: any) => ({
    name: r.student_name,
    topicBreakdown: r.topicBreakdown || {}
  }))

  const trendData = studentReports
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r: any, i: number) => ({ n: i + 1, name: r.student_name, pct: Math.round(r.percentage) }))

  if (!activeSession) {
    return (
      <div className="page-body animate-in">
        <div className="empty-state empty-state-modern">
          <span className="empty-icon-bubble icon-bubble-primary">
            <Icon name="analytics" size={32} />
          </span>
          <h3>No Active Session</h3>
          <p>Start a session and run a quiz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-body animate-in">
      <div className="story-hero story-hero-compact">
        <div className="story-hero-text">
          <span className="kicker">READING THE SKY</span>
          <h2 style={{ margin: '4px 0' }}>Analytics</h2>
          <p className="subhead">Session {activeSession.code} · live insights from the class so far.</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="analytics-reading-the-sky.png"
            shape="puff"
            rotate={-4}
            width={140}
            height={140}
            fallbackLabel="analytics · reading the sky"
          />
        </div>
      </div>
      <div className="page-header" style={{ marginTop: -8 }}>
        <div />
        <button className="btn btn-ghost btn-sm" onClick={() => { setRefreshKey(k => k + 1); refresh() }}><Icon name="refresh" size={14} /> Refresh</button>
      </div>

      {loading && <LoadingBlock />}

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Students" value={analytics?.total_students || students.length} />
        <StatCard label="Class Avg" value={analytics?.avg_score ? `${Math.round(analytics.avg_score)}%` : '—'} color="var(--primary)" />
        <StatCard label="Weak Topics" value={weakTopics.length || '—'} color="var(--danger)" />
        <StatCard label="Submitted" value={studentReports.length} color="var(--success)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Topic Performance</h4>
          {chartData.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No quiz data yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.avg >= 60 ? 'var(--success)' : 'var(--danger)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Progress Trend</h4>
          {trendData.length < 2 ? <p style={{ color: 'var(--text-muted)' }}>More submissions needed</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="n" tick={{ fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="pct" stroke="var(--primary)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Class Performance Heatmap</h4>
        <PerformanceHeatmap topicBreakdown={analytics?.topicBreakdown || {}} students={heatmapStudents} />
      </div>

      {misconceptions.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12 }}>Detected Misconceptions</h4>
          {misconceptions.slice(0, 6).map((m: any) => (
            <div key={m.id} style={{ padding: 12, background: 'var(--danger-dim)', borderRadius: 8, marginBottom: 8 }}>
              <strong>{m.topic}</strong> · {m.category}
              <p style={{ fontSize: 12, marginTop: 4 }}>{m.explanation}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="lightbulb" size={12} /> {m.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}

      {analytics?.aiSummary && (
        <div className="card">
          <h4 style={{ marginBottom: 8 }}>AI Summary</h4>
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>{analytics.aiSummary}</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  )
}
