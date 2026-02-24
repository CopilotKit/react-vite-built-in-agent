import { useState, useCallback } from 'react'
import './style.css'
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import { Counter } from './components/Counter'
import { CounterController } from './components/CounterController'
import { ErrorBoundary } from './components/ErrorBoundary'
import { IncidentForm } from './components/IncidentForm'
import { IncidentsList } from './components/IncidentsList'
import type { IncidentData } from './components/IncidentForm'
import type { Incident, IncidentSeverity } from './types/incident'

const severityMap: Record<IncidentData['severity'], IncidentSeverity> = {
  critical: 'P0',
  high: 'P1',
  medium: 'P2',
  low: 'P3',
}

function AppContent() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false)

  const activeCount = incidents.filter(i => i.status !== 'Resolved').length

  // Share incident details with the AI
  useCopilotReadable({
    description: "The current list of incidents with their status, severity, title, and description",
    value: {
      activeCount,
      total: incidents.length,
      incidents: incidents.map(i => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        description: i.description,
      })),
    },
  })

  const handleReportIncident = useCallback((data: IncidentData) => {
    const newIncident: Incident = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      severity: severityMap[data.severity],
      status: 'Open',
      affectedServices: [],
      detectionSource: 'manual',
      timestamps: { created: new Date().toISOString() },
      owner: data.assignee,
      timeline: [],
    }
    setIncidents(prev => [newIncident, ...prev])
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
              <button className="btn-secondary">Sign In</button>
              <button className="btn-primary">Get Started</button>
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
                    <div className="metric-value">4.2m</div>
                    <div className="metric-label">Average</div>
                  </div>
                </div>
                <p className="card-description">
                  Average time to resolve incidents today
                </p>
              </div>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">Resolved Today</h3>
                </div>
                <div className="card-content">
                  <div className="metric">
                    <div className="metric-value">47</div>
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
              <div className="card-header">
                <h3 className="card-title">Reported Incidents</h3>
                <span className="card-badge">{activeCount} Active</span>
              </div>
              <div className="card-content">
                <IncidentsList incidents={incidents} maxItems={10} />
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
          instructions="You are an AI incident response assistant for IncidentResponse, a platform for managing and resolving security and operational incidents. Help users track incidents, analyze metrics, and respond to issues."
          labels={{
            title: "Incident Response Assistant",
            initial: "Hello! I'm your incident response assistant. How can I help you manage incidents today?",
          }}
        >
          <AppContent />
        </CopilotSidebar>
      </CopilotKit>
    </ErrorBoundary>
  )
}

export default App
