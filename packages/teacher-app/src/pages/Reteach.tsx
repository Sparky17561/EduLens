import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useReport } from '../hooks/useReport'
import { aiApi } from '../api/client'
import { EmptyState, LoadingBlock } from '../components/ui'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

export default function Reteach() {
  const { activeSession } = useAppStore()
  const { report, loading, refresh } = useReport(activeSession?.id || null)
  const [generating, setGenerating] = useState(false)
  const [plans, setPlans] = useState<any[]>(report?.reteachPlans || [])

  React.useEffect(() => {
    if (report?.reteachPlans) setPlans(report.reteachPlans)
  }, [report])

  const generate = async () => {
    if (!activeSession) return
    const weak = report?.analytics?.weakTopics || report?.insights?.weakAreas || []
    if (!weak.length) return
    setGenerating(true)
    try {
      const data = await aiApi.reteach(activeSession.id, weak)
      setPlans(data.plans || [])
      refresh()
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  const assign = async (id: string) => {
    await aiApi.updateReteachPlan(id, { status: 'assigned' })
    refresh()
  }

  if (!activeSession) {
    return (
      <div className="page-body animate-in">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 20px' }}>
          <StoryImage
            file="reteach-pond-return.png"
            shape="puff"
            rotate={-5}
            width={300}
            height={300}
            fallbackLabel="reteach · pond return"
          />
          <span className="kicker">RETURN TO THE POND</span>
          <h3 style={{ textAlign: 'center', margin: 0 }}>No Active Session</h3>
          <p style={{ textAlign: 'center', maxWidth: 360, color: 'var(--text-muted)' }}>
            Start a session and run a quiz to generate reteach plans from weak topics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-body animate-in">
      <div className="story-hero story-hero-compact">
        <div className="story-hero-text">
          <span className="kicker">RETEACH LOOP</span>
          <h2 style={{ margin: '4px 0' }}>Returning to the pond</h2>
          <p className="subhead">Auto-generated lesson plans from class weak topics.</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="reteach-pond-return.png"
            shape="soft"
            rotate={3}
            width={140}
            height={140}
            fallbackLabel="reteach · pond return"
          />
        </div>
      </div>
      <div className="page-header" style={{ marginTop: -8 }}>
        <div />
        <button className="btn btn-primary" onClick={generate} disabled={generating || loading}>
          {generating ? <span className="spinner" /> : <><Icon name="sparkle" size={16} /> Generate Plans</>}
        </button>
      </div>

      {loading && <LoadingBlock label="Loading analytics…" />}

      {!loading && plans.length === 0 && (
        <EmptyState
          icon="book-open"
          tone="primary"
          title="No reteach plans yet"
          description="Click Generate Plans after students complete a quiz."
          action={<button className="btn btn-ghost" onClick={generate}>Generate from weak topics</button>}
        />
      )}

      {plans.map((plan: any) => (
        <div key={plan.id} className="card" style={{ marginBottom: 16 }}>
          <PlanHeader plan={plan} onAssign={() => assign(plan.id)} />
          <p style={{ fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{plan.lesson_summary}</p>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
            <h4 style={{ marginBottom: 6 }}>Concept</h4>
            <p style={{ fontSize: 13 }}>{plan.concept_explanation}</p>
          </div>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div>
              <h4>Exercises</h4>
              <ul style={{ fontSize: 13, paddingLeft: 18 }}>
                {JSON.parse(plan.exercises_json || '[]').map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </div>
            <div>
              <h4>Examples</h4>
              <ul style={{ fontSize: 13, paddingLeft: 18 }}>
                {JSON.parse(plan.examples_json || '[]').map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanHeader({ plan, onAssign }: { plan: any; onAssign: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: 0 }}>{plan.topic}</h3>
        <span className={`badge ${plan.status === 'assigned' ? 'badge-success' : 'badge-muted'}`}>{plan.status}</span>
      </div>
      {plan.status !== 'assigned' && (
        <button className="btn btn-success btn-sm" onClick={onAssign}>Assign to Class</button>
      )}
    </div>
  )
}
