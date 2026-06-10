import { Bot } from 'lucide-react'

export function AIReplyPanel({ replyBody }: { replyBody: string }) {
  return (
    <div className="ai-panel mt-6">
      <div className="ai-panel-header">
        <Bot size={16} color="#3b82f6" />
        <span className="ai-panel-label">Automated System Response</span>
      </div>
      <div className="ai-panel-body whitespace-pre-wrap">
        {replyBody}
      </div>
    </div>
  )
}
