import { useFrontendTool } from '@copilotkit/react-core'
import type { Incident } from '../types/incident'

interface CounterControllerProps {
  incidents: Incident[]
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>
}

export function CounterController({ incidents, setIncidents }: CounterControllerProps) {
  // Tool: Resolve an incident by ID (or the most recent one)
  useFrontendTool({
    name: 'resolveIncident',
    description: 'Resolve an incident. If no incidentId is provided, resolves the most recent open incident.',
    parameters: [
      {
        name: 'incidentId',
        type: 'string',
        description: 'The ID of the incident to resolve. If omitted, the most recent open incident is resolved.',
        required: false,
      },
    ],
    handler: async ({ incidentId }: { incidentId?: string }) => {
      const target = incidentId
        ? incidents.find(i => i.id === incidentId)
        : incidents.find(i => i.status !== 'Resolved')

      if (!target) return 'No open incidents to resolve.'

      setIncidents(prev =>
        prev.map(i =>
          i.id === target.id
            ? { ...i, status: 'Resolved' as const, timestamps: { ...i.timestamps, resolved: new Date().toISOString() } }
            : i
        )
      )
      return `Resolved incident "${target.title}" (${target.id}).`
    },
  })

  // Tool: Clear all incidents (resolve all)
  useFrontendTool({
    name: 'clearAllIncidents',
    description: 'Resolve all active incidents at once.',
    parameters: [],
    handler: async () => {
      const now = new Date().toISOString()
      setIncidents(prev =>
        prev.map(i =>
          i.status !== 'Resolved'
            ? { ...i, status: 'Resolved' as const, timestamps: { ...i.timestamps, resolved: now } }
            : i
        )
      )
      return 'All incidents resolved.'
    },
  })

  // Tool: Report a new incident via the AI
  useFrontendTool({
    name: 'reportIncident',
    description: 'Report a new incident with a title, description, and severity.',
    parameters: [
      { name: 'title', type: 'string', description: 'Short title of the incident', required: true },
      { name: 'description', type: 'string', description: 'Description of the incident', required: false },
      { name: 'severity', type: 'string', description: 'Severity: P0 (critical), P1 (high), P2 (medium), P3 (low), P4 (info). Defaults to P2.', required: false },
    ],
    handler: async ({ title, description = '', severity = 'P2' }: { title: string; description?: string; severity?: string }) => {
      const validSeverities = ['P0', 'P1', 'P2', 'P3', 'P4'] as const
      const sev = validSeverities.includes(severity as any) ? (severity as typeof validSeverities[number]) : 'P2'
      const newIncident: Incident = {
        id: crypto.randomUUID(),
        title,
        description,
        severity: sev,
        status: 'Open',
        affectedServices: [],
        detectionSource: 'copilot',
        timestamps: { created: new Date().toISOString() },
        timeline: [],
      }
      setIncidents(prev => [newIncident, ...prev])
      return `Incident "${title}" reported with severity ${sev}.`
    },
  })

  return null
}
