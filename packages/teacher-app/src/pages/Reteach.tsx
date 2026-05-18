import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useReport } from '../hooks/useReport'
import { aiApi } from '../api/client'
import { EmptyState, LoadingBlock } from '../components/ui'

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
        <EmptyState icon="🔄" title="No Active Session" description="Start a session and run a quiz to generate reteach plans from weak topics." />
      </div>
    )
  }

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Reteach Loop</h2>
          <p>Auto-generated lesson plans from class weak topics</p>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating || loading}>
          {generating ? <span className="spinner" /> : '✨ Generate Plans'}
        </button>
      </div>

      {loading && <LoadingBlock label="Loading analytics…" />}

      {!loading && plans.length === 0 && (
        <EmptyState
          icon="📖"
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
