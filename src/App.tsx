import { useState, useCallback, useMemo, useEffect } from 'react'
import './style.css'
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import { Counter } from './components/Counter'
import { CounterController } from './components/CounterController'
import { ErrorBoundary } from './components/ErrorBoundary'
import { IncidentForm } from './components/IncidentForm'
import { IncidentsList } from './components/IncidentsList'
import { IncidentDetail } from './components/IncidentDetail'
import { CrossIncidentTimeline } from './components/CrossIncidentTimeline'
import type { IncidentData } from './components/IncidentForm'
import type { Incident, IncidentSeverity, IncidentStatus } from './types/incident'
import { fetchAllIncidents } from './services/mockApi'

type SortOption = 'newest' | 'oldest' | 'severity' | 'status'
const severityOrder: Record<IncidentSeverity, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 }
const statusOrder: Record<IncidentStatus, number> = { Open: 0, Investigating: 1, Mitigated: 2, Resolved: 3 }
const allSeverities: Array<IncidentSeverity | 'All'> = ['All', 'P0', 'P1', 'P2', 'P3', 'P4']
const allStatuses: Array<IncidentStatus | 'All'> = ['All', 'Open', 'Investigating', 'Mitigated', 'Resolved']

const severityMap: Record<IncidentData['severity'], IncidentSeverity> = {
  critical: 'P0',
  high: 'P1',
  medium: 'P2',
  low: 'P3',
}

function AppContent() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isIncidentsCollapsed, setIsIncidentsCollapsed] = useState(false)

  useEffect(() => {
    fetchAllIncidents().then(setIncidents)
  }, [])

  // Filter / sort / search state
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'All'>('All')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filteredIncidents = useMemo(() => {
    let result = incidents

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.affectedServices.some(s => s.toLowerCase().includes(q)) ||
        (i.owner && i.owner.toLowerCase().includes(q))
      )
    }

    // Severity filter
    if (severityFilter !== 'All') {
      result = result.filter(i => i.severity === severityFilter)
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(i => i.status === statusFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime()
        case 'oldest':
          return new Date(a.timestamps.created).getTime() - new Date(b.timestamps.created).getTime()
        case 'severity':
          return severityOrder[a.severity] - severityOrder[b.severity]
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

    return result
  }, [incidents, searchQuery, severityFilter, statusFilter, sortBy])

  const activeCount = incidents.filter(i => i.status !== 'Resolved').length

  // Dynamic metrics
  const resolvedToday = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return incidents.filter(
      i => i.status === 'Resolved' && i.timestamps.resolved && new Date(i.timestamps.resolved).getTime() > oneDayAgo
    ).length
  }, [incidents])

  const mttr = useMemo(() => {
    const resolved = incidents.filter(i => i.timestamps.resolved)
    if (resolved.length === 0) return null
    const totalMs = resolved.reduce((sum, i) => {
      const created = new Date(i.timestamps.created).getTime()
      const resolvedAt = new Date(i.timestamps.resolved!).getTime()
      return sum + (resolvedAt - created)
    }, 0)
    const avgMs = totalMs / resolved.length
    const avgMinutes = avgMs / 60000
    if (avgMinutes < 1) return `${Math.round(avgMs / 1000)}s`
    if (avgMinutes < 60) return `${avgMinutes.toFixed(1)}m`
    return `${(avgMinutes / 60).toFixed(1)}h`
  }, [incidents])

  // Sort incidents newest-first so the AI sees them in the same order as the dashboard
  const sortedIncidents = useMemo(() =>
    [...incidents].sort((a, b) =>
      new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime()
    ),
    [incidents]
  )

  // Share incident details with the AI
  useCopilotReadable({
    description: "The current list of incidents sorted newest-first, with their status, severity, title, description, and timestamps (created, acknowledged, resolved). Use timestamps.created to answer time-based queries like 'incidents in the last 24 hours'.",
    value: {
      activeCount,
      total: incidents.length,
      currentTime: new Date().toISOString(),
      incidents: sortedIncidents.map(i => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        description: i.description,
        affectedServices: i.affectedServices,
        timestamps: i.timestamps,
      })),
    },
  })

  useCopilotReadable({
    description: "The currently selected/viewed incident with full detail",
    value: selectedIncident
      ? {
          id: selectedIncident.id,
          title: selectedIncident.title,
          severity: selectedIncident.severity,
          status: selectedIncident.status,
          description: selectedIncident.description,
          affectedServices: selectedIncident.affectedServices,
          owner: selectedIncident.owner,
          detectionSource: selectedIncident.detectionSource,
          timestamps: selectedIncident.timestamps,
          timelineLength: selectedIncident.timeline.length,
        }
      : null,
  })

  const handleReportIncident = useCallback((data: IncidentData) => {
    const now = new Date().toISOString()
    const affectedServices = data.affectedSystems
      ? data.affectedSystems.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const timeline: Incident['timeline'] = []
    if (data.initialObservations?.trim()) {
      timeline.push({
        id: crypto.randomUUID(),
        timestamp: now,
        type: 'comment',
        description: data.initialObservations.trim(),
        author: data.assignee || 'Reporter',
      })
    }
    const newIncident: Incident = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      severity: severityMap[data.severity],
      status: 'Open',
      affectedServices,
      detectionSource: 'manual',
      timestamps: { created: now },
      owner: data.assignee,
      timeline,
    }
    setIncidents(prev => [newIncident, ...prev])
  }, [])

  const handleStatusChange = useCallback((incidentId: string, newStatus: IncidentStatus) => {
    const now = new Date().toISOString()
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== incidentId) return i
        const updated: Incident = {
          ...i,
          status: newStatus,
          timestamps: {
            ...i.timestamps,
            ...(newStatus === 'Resolved' ? { resolved: now } : {}),
            ...(newStatus === 'Investigating' && !i.timestamps.acknowledged ? { acknowledged: now } : {}),
          },
          timeline: [
            ...i.timeline,
            {
              id: crypto.randomUUID(),
              timestamp: now,
              type: 'status_change',
              description: `Status changed from ${i.status} to ${newStatus}`,
              author: 'System',
            },
          ],
        }
        setSelectedIncident(updated)
        return updated
      })
    )
  }, [])

  const handleAddComment = useCallback((incidentId: string, comment: string) => {
    const now = new Date().toISOString()
    setIncidents(prev =>
      prev.map(i => {
        if (i.id !== incidentId) return i
        const updated: Incident = {
          ...i,
          timeline: [
            ...i.timeline,
            {
              id: crypto.randomUUID(),
              timestamp: now,
              type: 'comment',
              description: comment,
              author: i.owner || 'User',
            },
          ],
        }
        setSelectedIncident(updated)
        return updated
      })
    )
  }, [])

  return (
    <div id="app-content" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">🚨</div>
              <span className="logo-text">IncidentResponse</span>
            </div>
            <nav className="nav">
              <a href="#dashboard" className="nav-link">Dashboard</a>
              <a href="#incidents" className="nav-link">Incidents</a>
              <a href="#analytics" className="nav-link">Analytics</a>
            </nav>
            <div className="header-actions">
              <span className="welcome-text">Welcome, Nathan</span>
              <div className="avatar" aria-label="User avatar">NT</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1 className="hero-title">
                Rapid Incident Response with
                <span className="gradient-text"> AI-Powered</span> Intelligence
              </h1>
              <p className="hero-description">
                Detect, analyze, and resolve incidents faster with real-time monitoring and intelligent automation.
                Minimize downtime and protect your infrastructure.
              </p>
              <div className="hero-actions">
                <button className="btn-primary btn-large">View Dashboard</button>
                <button className="btn-outline btn-large">See How It Works</button>
              </div>
            </div>
          </section>

          {/* Dashboard Section */}
          <section className="dashboard">
            <div className="dashboard-header">
              <div>
                <h2 className="section-title">Incident Dashboard</h2>
                <p className="section-subtitle">Real-time incident monitoring and response metrics</p>
              </div>
              <button
                className="btn-primary btn-large"
                onClick={() => setIsIncidentFormOpen(true)}
              >
                Report Incident
              </button>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Active Incidents</h3>
                  <span className="card-badge">Live</span>
                </div>
                <div className="card-content">
                  <Counter count={activeCount} onOpenForm={() => setIsIncidentFormOpen(true)} />
                  <CounterController incidents={incidents} setIncidents={setIncidents} />
                </div>
                <p className="card-description">
                  Currently open incidents requiring attention
                </p>
              </div>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Mean Time to Resolve</h3>
                </div>
                <div className="card-content">
                  <div className="metric">
                    <div className="metric-value">{mttr ?? '—'}</div>
                    <div className="metric-label">Average</div>
                  </div>
                </div>
                <p className="card-description">
                  Average time to resolve incidents
                </p>
              </div>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Resolved Today</h3>
                </div>
                <div className="card-content">
                  <div className="metric">
                    <div className="metric-value">{resolvedToday}</div>
                    <div className="metric-label">Incidents</div>
                  </div>
                </div>
                <p className="card-description">
                  Successfully resolved incidents in the last 24 hours
                </p>
              </div>
            </div>

            {/* Reported Incidents */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
              <div
                className="card-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsIncidentsCollapsed(prev => !prev)}
              >
                <h3 className="card-title">
                  <span className={`collapse-chevron${isIncidentsCollapsed ? ' collapsed' : ''}`}>&#9660;</span>
                  {' '}Reported Incidents
                </h3>
                <span className="card-badge">{activeCount} Active</span>
              </div>

              {!isIncidentsCollapsed && <>
              {/* Toolbar */}
              <div className="incidents-toolbar">
                <input
                  type="text"
                  className="toolbar-search-input"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="toolbar-filters">
                  <div className="filter-pills">
                    <span className="filter-pills-label">Severity:</span>
                    {allSeverities.map(s => (
                      <button
                        key={s}
                        className={`filter-pill${severityFilter === s ? ' active' : ''}`}
                        onClick={() => setSeverityFilter(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="filter-pills">
                    <span className="filter-pills-label">Status:</span>
                    {allStatuses.map(s => (
                      <button
                        key={s}
                        className={`filter-pill${statusFilter === s ? ' active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="toolbar-sort">
                  <label htmlFor="sort-select">Sort:</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="severity">By Severity</option>
                    <option value="status">By Status</option>
                  </select>
                </div>
              </div>

              <div className="card-content">
                <IncidentsList incidents={filteredIncidents} onIncidentClick={setSelectedIncident} />
              </div>
              </>}
            </div>

            {/* Activity Timeline */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h3 className="card-title">Activity Timeline</h3>
                <span className="card-badge">Recent</span>
              </div>
              <div className="card-content">
                <CrossIncidentTimeline
                  incidents={filteredIncidents}
                  onIncidentClick={setSelectedIncident}
                />
              </div>
            </div>
          </section>
        </main>

        {/* Incident Form Modal */}
        <IncidentForm
          isOpen={isIncidentFormOpen}
          onClose={() => setIsIncidentFormOpen(false)}
          onSubmit={handleReportIncident}
        />

        {/* Incident Detail Modal */}
        {selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            allIncidents={incidents}
            isOpen={!!selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
          />
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2024 IncidentResponse. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <CopilotKit
        runtimeUrl={import.meta.env.VITE_COPILOTKIT_RUNTIME_URL || "http://localhost:4000/copilotkit"}
        publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_API_KEY}
      >
        <CopilotSidebar
          instructions="You are an AI incident response assistant for IncidentResponse, a platform for managing and resolving security and operational incidents. Help users track incidents, analyze metrics, and respond to issues. When you use the generateChart tool, the chart is rendered automatically in the chat — do NOT add any markdown images, image links, or image syntax in your response. Just describe what the chart shows in plain text."
          labels={{
            title: "Incident Response Assistant",
            initial: "Hello! I'm your incident response assistant. How can I help you manage incidents today?",
          }}
          suggestions={[
            { title: "Incidents in the last 48 hours", message: "Show a graph of incidents in the last 48 hours" },
            { title: "Severity Chart", message: "Show me a chart of incidents by severity" },
            { title: "Incident Summary", message: "Give me a summary of all active incidents and their current status" },
          ]}
        >
          <AppContent />
        </CopilotSidebar>
      </CopilotKit>
    </ErrorBoundary>
  )
}

export default App
