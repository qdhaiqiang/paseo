/**
 * Gas City Supervisor API Client
 * Provides typed access to Gas City Supervisor REST endpoints
 */

export interface SupervisorConfig {
  baseUrl: string;
  city: string;
}

export interface Rig {
  id: string;
  name: string;
  path: string;
  branch: string;
  state: string;
}

export interface Session {
  id: string;
  rig_id: string;
  name: string;
  state: string;
  created_at: string;
}

export interface StructuredMessage {
  id: string;
  client_message_id?: string;
  turn_id?: string;
  role: string;
  provider?: string;
  timestamp?: string;
  model?: string;
  status: string;
  blocks: Array<{
    kind: string;
    text?: string;
    [key: string]: any;
  }>;
}

export class SupervisorClient {
  private config: SupervisorConfig;

  constructor(config: SupervisorConfig) {
    this.config = config;
  }

  private url(path: string): string {
    return `${this.config.baseUrl}/v0/city/${this.config.city}${path}`;
  }

  async getRigs(): Promise<Rig[]> {
    const response = await fetch(this.url("/rigs"));
    if (!response.ok) throw new Error(`Failed to fetch rigs: ${response.statusText}`);
    const data = await response.json();
    return data.items || [];
  }

  async getSessions(rigId?: string): Promise<Session[]> {
    const params = rigId ? `?rig=${rigId}` : "";
    const response = await fetch(this.url(`/sessions${params}`));
    if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    const data = await response.json();
    return data.items || [];
  }

  async createSession(rigId: string, name?: string): Promise<Session> {
    const response = await fetch(this.url("/sessions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rig_id: rigId,
        name: name || `session-${Date.now()}`,
      }),
    });
    if (!response.ok) throw new Error(`Failed to create session: ${response.statusText}`);
    return response.json();
  }

  async submitMessage(
    sessionId: string,
    message: string,
    clientMessageId?: string
  ): Promise<{ request_id: string; turn_id?: string; event_cursor: string }> {
    const response = await fetch(this.url(`/session/${sessionId}/submit`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        client_message_id: clientMessageId,
      }),
    });
    if (!response.ok) throw new Error(`Failed to submit message: ${response.statusText}`);
    return response.json();
  }

  async getTranscriptStream(sessionId: string, cursor?: string): Promise<EventSource> {
    const params = cursor ? `?cursor=${cursor}` : "";
    const url = this.url(`/session/${sessionId}/transcript/stream${params}`);
    return new EventSource(url);
  }
}
