export function StatsCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="stats-card" data-number={value}>
      <div className="stats-label">{label}</div>
      <div className={`stats-value ${accent ? 'stats-accent' : ''}`}>
        {value}
      </div>
    </div>
  )
}
