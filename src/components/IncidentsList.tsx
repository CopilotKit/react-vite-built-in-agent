import { useState } from 'react'
import type { Incident } from '../types/incident'
import './IncidentsList.css'

interface IncidentsListProps {
  incidents: Incident[]
  onIncidentClick?: (incident: Incident) => void
  maxItems?: number
  defaultExpanded?: boolean
}

export function IncidentsList({ incidents, onIncidentClick, maxItems = 5, defaultExpanded = true }: IncidentsListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const displayIncidents = maxItems ? incidents.slice(0, maxItems) : incidents
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved')

  if (incidents.length === 0) {
    return (
      <div className="incidents-list-empty">
        <p>No incidents reported yet.</p>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0': return '#ef4444'
      case 'P1': return '#f97316'
      case 'P2': return '#eab308'
      case 'P3': return '#3b82f6'
      case 'P4': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#ef4444'
      case 'Investigating': return '#f97316'
      case 'Mitigated': return '#3b82f6'
      case 'Resolved': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <div className="incidents-list">
      <div 
        className="incidents-list-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
      >
        <div className="incidents-header-left">
          <span className="incidents-count">{activeIncidents.length} Active</span>
          {incidents.length > maxItems && (
            <span className="incidents-more">+{incidents.length - maxItems} more</span>
          )}
        </div>
        <button 
          className={`incidents-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-label={isExpanded ? 'Collapse incidents' : 'Expand incidents'}
          aria-expanded={isExpanded}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M4 6L8 10L12 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div className="incidents-list-items">
          {displayIncidents.map((incident) => (
            <div
              key={incident.id}
              className="incident-item"
              onClick={() => onIncidentClick?.(incident)}
            >
              <div className="incident-item-header">
                <div className="incident-severity" style={{ backgroundColor: getSeverityColor(incident.severity) }}>
                  {incident.severity}
                </div>
                <h4 className="incident-title">{incident.title}</h4>
                <div className="incident-status" style={{ color: getStatusColor(incident.status) }}>
                  {incident.status}
                </div>
              </div>
              <p className="incident-description">{incident.description}</p>
              <div className="incident-meta">
                {incident.affectedServices.length > 0 && (
                  <span className="incident-services">
                    {incident.affectedServices.join(', ')}
                  </span>
                )}
                {incident.owner && (
                  <span className="incident-owner">Owner: {incident.owner}</span>
                )}
                <span className="incident-time">
                  {new Date(incident.timestamps.created).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
