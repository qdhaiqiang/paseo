# Phase 2 P0 Features: SSE Streaming and Message Sending - Completed

**Date**: 2026-09-26
**Status**: Implementation Complete, Pending Runtime Testing

## Overview

This document summarizes the completion of Phase 2 P0 (Priority 0) core features for the Gas City Studio Paseo plugin: real-time transcript streaming via SSE and message sending with correlation support.

## Completed Features

### 1. MessageComposer Component (`client/MessageComposer.tsx`)

**Purpose**: User input component for composing and sending messages to AI agents.

**Key Features**:
- Multiline `TextInput` with auto-resize (max 5 lines)
- Auto-generation of unique `client_message_id` using format: `msg-{timestamp}-{random}`
- Loading state indicator during message submission
- Disabled state when no session is selected or message is empty
- Shift+Enter support for newlines (Enter sends message)
- Theme-aware styling using Paseo's theme system

**Correlation Support**:
```typescript
const generateClientMessageId = useCallback(() => {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}, []);
```

Each message sent includes this ID, which flows through:
1. Client → Supervisor API (`submitMessage`)
2. Supervisor → Worker (via `MessageRequest.ClientMessageID`)
3. Worker → HistoryEntry (stored in session history)
4. HistoryEntry → StructuredMessage (returned in SSE stream)
5. UI matches responses to requests using this ID

### 2. useTranscriptStream Hook (`client/useTranscriptStream.ts`)

**Purpose**: Custom React hook managing Server-Sent Events (SSE) connection for real-time transcript updates.

**Key Features**:
- Automatic EventSource connection management
- Cursor tracking for resume capability (sends `lastEventId` header)
- Handles multiple event types:
  - `structured`: Transcript message updates (upsert/snapshot operations)
  - `turn.started`: New conversation turn started
  - `turn.completed`: Turn finished successfully
  - `turn.failed`: Turn encountered an error
- Auto-reconnect with 3-second delay on connection errors
- Cleanup on unmount or session change
- Message deduplication by ID (prevents duplicates on reconnection)

**Event Handling**:
```typescript
// Listen for structured transcript events
es.addEventListener("structured", (event) => {
  const data = JSON.parse(event.data);
  if (data.operation === "upsert") {
    data.structured_messages.forEach(msg => onMessageReceived(msg));
  }
});

// Listen for turn lifecycle events
es.addEventListener("turn.started", (event) => {
  onTurnStarted?.(JSON.parse(event.data));
});
```

### 3. Panel Integration (`client/GasCityStudioPanel.tsx`)

**Changes Made**:

#### State Management
Added new state variables:
- `sending`: Boolean tracking message submission status
- `turnStatus`: String displaying current turn lifecycle status

#### Message Sending Logic
```typescript
const handleSendMessage = useCallback(async (messageText: string, clientMessageId: string) => {
  // 1. Submit to supervisor API
  const result = await client.submitMessage(selectedSession.id, messageText, clientMessageId);

  // 2. Optimistically add user message to transcript
  const userMessage: StructuredMessage = {
    id: `temp-${clientMessageId}`,
    client_message_id: clientMessageId,
    turn_id: result.turn_id,
    role: "user",
    status: "final",
    blocks: [{ kind: "text", text: messageText }],
    timestamp: new Date().toISOString(),
  };
  setMessages((prev) => [...prev, userMessage]);
}, [selectedSession, client]);
```

#### SSE Stream Integration
```typescript
const { cursor } = useTranscriptStream({
  sessionId: selectedSession?.id || null,
  baseUrl: client.config.baseUrl,
  city: client.config.city,
  onMessageReceived: handleNewMessage,
  onTurnStarted: handleTurnStarted,
  onTurnCompleted: handleTurnCompleted,
  onTurnFailed: handleTurnFailed,
});
```

#### UI Layout
Updated transcript tab render to include:
1. Agent Avatar header with turn status display
2. TranscriptViewer (flexible height, scrollable)
3. MessageComposer (fixed at bottom, separated by border)

```tsx
<View style={{ flex: 1 }}>
  <AgentAvatar ... />
  {turnStatus ? <Text>{turnStatus}</Text> : null}

  <View style={{ flex: 1 }}>
    <TranscriptViewer messages={messages} theme={theme} isLoading={loadingTranscript} />
  </View>

  <View style={{ borderTopWidth: 1, borderColor: theme.colors.border }}>
    <MessageComposer onSend={handleSendMessage} disabled={!selectedSession} loading={sending} theme={theme} />
  </View>
</View>
```

## Data Flow

### Message Sending Flow
```
User types message → MessageComposer.onSend()
  ↓
GasCityStudioPanel.handleSendMessage()
  ↓
SupervisorClient.submitMessage(sessionId, text, clientMessageId)
  ↓
POST /v0/city/{city}/session/{sessionId}/submit
  ↓
{ request_id, turn_id, event_cursor }
  ↓
Optimistic UI update (add user message to transcript)
```

### Real-time Update Flow
```
SSE Connection → EventSource(/v0/city/{city}/session/{sessionId}/transcript/stream)
  ↓
Server emits "structured" event
  ↓
useTranscriptStream parses event data
  ↓
onMessageReceived(msg) callback
  ↓
GasCityStudioPanel.handleNewMessage()
  ↓
Deduplicate by message ID → Update or insert into messages array
  ↓
TranscriptViewer re-renders with updated messages
```

### Turn Lifecycle Flow
```
User sends message → Server emits "turn.started"
  ↓
useTranscriptStream → onTurnStarted()
  ↓
Set turnStatus: "Turn started: {turn_id}..."
  ↓
... AI processing ...
  ↓
Server emits "turn.completed" or "turn.failed"
  ↓
useTranscriptStream → onTurnCompleted() or onTurnFailed()
  ↓
Clear turnStatus or show error
```

## Correlation Field Verification

Both correlation fields are now fully integrated:

| Field | Generated By | Used In | Purpose |
|-------|-------------|---------|---------|
| `client_message_id` | MessageComposer (client) | submitMessage API, HistoryEntry, StructuredMessage | Match client requests to server responses |
| `turn_id` | Supervisor server | AsyncAcceptedBody, HistoryEntry, StructuredMessage, TurnEvents | Track conversation turns across layers |

**Verification Points**:
1. ✅ MessageComposer generates unique `client_message_id` for each message
2. ✅ `submitMessage()` passes `client_message_id` to API
3. ✅ `useTranscriptStream` receives messages with both `client_message_id` and `turn_id`
4. ✅ Deduplication logic uses message `id` field (server-generated)
5. ✅ Turn status display shows `turn_id` from turn events

## Code Statistics

| File | Lines Added | Purpose |
|------|------------|---------|
| `client/MessageComposer.tsx` | ~120 | Message input component |
| `client/useTranscriptStream.ts` | ~180 | SSE hook with event handling |
| `client/GasCityStudioPanel.tsx` | ~60 | Integration code (state, callbacks, UI) |
| **Total** | **~360** | |

## Git Commits

```
commit 552b137d1 feat(gas-city-studio): add SSE streaming and message sending
- Integrate MessageComposer component for message input with auto-generated client_message_id
- Add useTranscriptStream hook for real-time SSE transcript updates
- Implement turn lifecycle event handling (started/completed/failed)
- Add optimistic UI updates for sent messages
- Display turn status in agent avatar header
- Support message deduplication and updates via correlation fields
```

**Remote**: Pushed to `qdhaiqiang/paseo` fork, branch `main`

## Testing Requirements

To verify these features work correctly, the following runtime environment is needed:

### Prerequisites
1. **Paseo Daemon**: Running and accepting plugin installations
2. **Gas City Supervisor**: Running on `http://localhost:8080` with at least one rig configured
3. **Paseo CLI**: Installed globally or accessible via `npm run cli`

### Test Scenarios

#### Scenario 1: Message Sending
1. Install plugin: `paseo plugin install ./plugin-examples/gas-city-studio`
2. Open Gas City Studio panel in Paseo workspace
3. Select a rig and session
4. Type a message in the composer
5. Click Send
6. Verify:
   - Loading indicator appears
   - Message appears in transcript immediately (optimistic update)
   - Turn status shows "Sending message..."
   - After response, turn status clears

#### Scenario 2: SSE Streaming
1. With session selected, observe transcript viewer
2. Send a message
3. Verify:
   - SSE connection established (check browser/devtools network tab)
   - Assistant response appears in real-time (not polling)
   - Partial updates show as they arrive (if supported)
   - Final message has `status: "final"`

#### Scenario 3: Turn Lifecycle
1. Send a message
2. Observe turn status text in header
3. Verify:
   - Shows "Turn started: turn-XXXX..." when turn begins
   - Clears when turn completes
   - Shows error message if turn fails

#### Scenario 4: Reconnection
1. Start a long-running operation
2. Simulate network disconnect (if possible)
3. Verify:
   - SSE reconnects after 3 seconds
   - Cursor is sent to resume from last event
   - No duplicate messages appear

## Known Limitations

1. **No Error Retry**: If `submitMessage()` fails, the message is not queued for retry
2. **Single Session**: Only one session's transcript can be streamed at a time
3. **No Message History Pagination**: Loads all messages at once (no cursor-based pagination for initial load)
4. **Hardcoded Supervisor URL**: Currently `http://localhost:8080`, should be configurable via settings

## Next Steps

### Immediate (P1 Features)
1. **Settings Interface**: Allow configuration of Supervisor URL and city name
2. **Error Handling**: Show user-friendly error messages for failed operations
3. **Loading States**: Better visual feedback during initial data load

### Future (P2 Features)
1. **Work Composer**: Create beads/work items from conversations
2. **File Browser**: View and navigate project files with Git status
3. **Command Palette**: Quick actions for common operations
4. **Multi-session View**: Compare transcripts across sessions

## Conclusion

The P0 core features for real-time interaction are now complete. The plugin can:
- Send messages with proper correlation tracking
- Receive real-time transcript updates via SSE
- Track turn lifecycle events
- Display conversation state to users

The implementation follows Paseo's plugin architecture using React Native components and integrates seamlessly with the Gas City Supervisor API's correlation fields added in Phase 1.

Pending items are primarily related to runtime testing (requires Paseo daemon) and UX polish (settings, error handling), which can be addressed in subsequent iterations.
