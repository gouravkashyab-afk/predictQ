"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, AlertCircle, Info } from "lucide-react";

interface Log {
  id: string;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AgentLogsProps {
  agentId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const LEVEL_CONFIG = {
  info: { icon: <Info size={11} />, className: "log-info" },
  warn: { icon: <AlertCircle size={11} />, className: "log-warn" },
  error: { icon: <AlertCircle size={11} />, className: "log-error" },
};

export default function AgentLogs({ agentId }: AgentLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/logs`);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadLogs();
    const timer = setInterval(loadLogs, 30_000);
    return () => clearInterval(timer);
  }, [loadLogs]);

  if (loading) {
    return <div className="agent-logs-panel"><div className="agent-log-skeleton" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="agent-logs-panel">
        <div className="agent-logs-empty">
          <Activity size={20} />
          <span>No logs yet — activate agent to see activity</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-logs-panel" id={`agent-logs-panel-${agentId}`}>
      <div className="agent-logs-header">
        <Activity size={13} />
        <span>Activity Log</span>
        <span className="agent-logs-count">{logs.length} entries</span>
      </div>
      <div className="agent-logs-feed">
        {logs.map((log) => {
          const levelMeta = LEVEL_CONFIG[log.level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG.info;
          const hasMetadata = Object.keys(log.metadata ?? {}).length > 0;

          return (
            <div key={log.id} className={`agent-log-row ${levelMeta.className}`}>
              <div className="agent-log-main" onClick={() => hasMetadata && setExpanded(expanded === log.id ? null : log.id)}>
                <span className={`agent-log-level ${levelMeta.className}`}>
                  {levelMeta.icon}
                  {log.level.toUpperCase()}
                </span>
                <span className="agent-log-message">{log.message}</span>
                <span className="agent-log-time">{timeAgo(log.createdAt)}</span>
                {hasMetadata && (
                  <span className="agent-log-expand">{expanded === log.id ? "▲" : "▼"}</span>
                )}
              </div>
              {expanded === log.id && hasMetadata && (
                <pre className="agent-log-meta">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
