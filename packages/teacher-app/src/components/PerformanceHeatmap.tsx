import React from 'react'

export default function PerformanceHeatmap({
  topicBreakdown,
  students
}: {
  topicBreakdown: Record<string, number>
  students: Array<{ name: string; topicBreakdown?: Record<string, number> }>
}) {
  const topics = Object.keys(topicBreakdown)
  if (!topics.length) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No topic data yet — run a quiz first.</p>
  }

  const cellColor = (pct: number) => {
    if (pct >= 70) return 'rgba(34,197,94,0.85)'
    if (pct >= 50) return 'rgba(245,158,11,0.85)'
    return 'rgba(239,68,68,0.85)'
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={thStyle}>Student</th>
            {topics.map(t => (
              <th key={t} style={thStyle}>{t.length > 10 ? t.slice(0, 9) + '…' : t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={topics.length + 1} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                Waiting for submissions…
              </td>
            </tr>
          ) : (
            students.map(s => (
              <tr key={s.name}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                {topics.map(t => {
                  const pct = s.topicBreakdown?.[t] ?? topicBreakdown[t] ?? 0
                  return (
                    <td key={t} style={tdStyle}>
                      <div
                        title={`${pct}%`}
                        style={{
                          width: 36,
                          height: 28,
                          borderRadius: 6,
                          background: cellColor(pct),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 10
                        }}
                      >
                        {pct}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  textAlign: 'left',
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
  fontWeight: 600
}

const tdStyle: React.CSSProperties = {
  padding: '6px',
  borderBottom: '1px solid var(--border)'
}
