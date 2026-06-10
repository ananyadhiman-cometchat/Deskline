

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action 
}: { 
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}


