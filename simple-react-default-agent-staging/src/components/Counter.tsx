interface CounterProps {
  count: number
  onOpenForm: () => void
}

export function Counter({ count, onOpenForm }: CounterProps) {
  return (
    <div className="counter-container">
      <div className="counter-display">
        <div className="counter-value">{count}</div>
        <div className="counter-label">Active Incidents</div>
      </div>
      <button
        className="counter-button"
        onClick={onOpenForm}
      >
        Report Incident
      </button>
    </div>
  )
}
