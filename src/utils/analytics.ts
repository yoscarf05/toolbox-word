/**
 * Toolbox Word Telemetry & Analytics Client
 * Sends aggregated metrics (NO document or private file content is EVER transmitted)
 */

export interface TelemetryEvent {
  type:
    | 'page_view'
    | 'tool_open'
    | 'conversion_started'
    | 'conversion_success'
    | 'conversion_failed'
    | 'citation_generated'
    | 'search'
    | 'favorite_added'
    | 'favorite_removed'
    | 'login'
    | 'signup'
    | 'logout'
    | 'error';
  toolSlug?: string;
  category?: string;
  durationMs?: number;
  status?: 'success' | 'failed';
  errorType?: string;
  errorMessage?: string;
  path?: string;
  details?: Record<string, any>;
}

export async function sendAnalyticsEvent(event: TelemetryEvent): Promise<void> {
  try {
    const payload = {
      ...event,
      path: event.path || (typeof window !== 'undefined' ? window.location.pathname : '/')
    };

    // Non-blocking fire-and-forget
    if (typeof window !== 'undefined' && window.navigator && window.navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      window.navigator.sendBeacon('/api/analytics/event', blob);
      return;
    }

    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    // Silent fail in client to never disrupt user workflows
  }
}

// Client Heartbeat
let heartbeatInterval: any = null;
export function startAnalyticsHeartbeat() {
  if (typeof window === 'undefined' || heartbeatInterval) return;

  const ping = () => {
    try {
      fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname }),
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  };

  ping();
  heartbeatInterval = setInterval(ping, 45000); // every 45s
}
