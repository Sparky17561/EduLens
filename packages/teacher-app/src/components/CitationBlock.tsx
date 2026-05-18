import React from 'react'
import { Icon } from './Icon'

export interface Citation {
  label?: string
  source?: string
  chapter?: string
  page?: number
}

export function CitationBlock({
  citations,
  confidence,
  confidenceNote
}: {
  citations?: Citation[]
  confidence?: 'high' | 'medium' | 'low'
  confidenceNote?: string
}) {
  if (!citations?.length && !confidence) return null

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
      {confidence && confidence !== 'high' && (
        <div
          style={{
            fontSize: 11,
            color: confidence === 'low' ? 'var(--danger)' : 'var(--warning)',
            marginBottom: citations?.length ? 6 : 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name={confidence === 'low' ? 'warning' : 'info'} size={12} />
          {confidenceNote || (confidence === 'low' ? 'Uncertain answer' : 'Verify with teacher')}
        </div>
      )}
      {citations?.map((c, i) => (
        <div
          key={i}
          style={{
            fontSize: 11,
            color: 'var(--primary)',
            marginTop: 4,
            padding: '4px 8px',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {c.label || (
            <>
              <Icon name="book" size={12} /> From {c.source}, p.{c.page}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
