import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSettings, type SettingsState } from "@getpaseo/plugin/client";
import { useToast } from "@getpaseo/plugin/client/react-native";
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SupervisorClient,
  type Rig,
  type Session,
  type StructuredMessage,
  type TurnEvent,
} from "./api/supervisor";
import { TranscriptViewer } from "./TranscriptViewer";
import { AgentAvatar } from "./AgentAvatar";
import { MessageComposer } from "./MessageComposer";
import { useTranscriptStream } from "./useTranscriptStream";
import { gasCityPreferences } from "../shared/preferences";

type Preferences = Extract<SettingsState<typeof gasCityPreferences.schema>, { status: "ready" }>;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 20, fontWeight: "bold", padding: 16, borderBottomWidth: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, padding: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  sidebar: { width: 240, borderRightWidth: 1 },
  sidebarSection: { padding: 12 },
  sidebarTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  sidebarItem: { padding: 10, borderRadius: 6, marginBottom: 4 },
  sidebarItemActive: { backgroundColor: "#007AFF20" },
  sidebarItemName: { fontSize: 13, fontWeight: "500" },
  sidebarItemMeta: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  mainContent: { flex: 1 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyStateText: { fontSize: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 13, opacity: 0.6 },
  button: { padding: 10, backgroundColor: "#007AFF", borderRadius: 6, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});

type TabType = "sessions" | "transcript";

export function GasCityStudioPanel({ theme }: Pick<PluginSurfaceProps, "theme">) {
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedRig, setSelectedRig] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TabType>("sessions");
  const [messages, setMessages] = useState<StructuredMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [sending, setSending] = useState(false);
  const [turnStatus, setTurnStatus] = useState<string>("");

  // Toast notifications
  const toast = useToast();

  // Load settings
  const settings = useSettings(gasCityPreferences);

  // Initialize API client with settings values
  const client = useMemo(() => {
    const supervisorUrl = settings.status === "ready" ? settings.values.supervisorUrl : "http://localhost:8080";
    const city = settings.status === "ready" ? settings.values.city : "main";
    return new SupervisorClient({
      baseUrl: supervisorUrl,
      city: city,
    });
  }, [settings]);

  // Handle incoming messages from SSE stream
  const handleNewMessage = useCallback((message: StructuredMessage) => {
    setMessages((prev) => {
      // Check if message already exists
      const exists = prev.some((m) => m.id === message.id);
      if (exists) {
        // Update existing message
        return prev.map((m) => (m.id === message.id ? message : m));
      }
      // Add new message
      return [...prev, message];
    });
  }, []);

  // Handle turn lifecycle events
  const handleTurnStarted = useCallback((event: TurnEvent) => {
    setTurnStatus(`Processing: ${event.turn_id.substring(0, 12)}...`);
  }, []);

  const handleTurnCompleted = useCallback((event: TurnEvent) => {
    setTurnStatus("");
    toast.show("Response received", { variant: "success" });
  }, [toast]);

  const handleTurnFailed = useCallback((event: TurnEvent) => {
    setTurnStatus("");
    const errorMsg = event.error_message || "Unknown error";
    toast.error(`Turn failed: ${errorMsg}`);
    console.error("Turn failed:", event);
  }, [toast]);

  // Connect to SSE transcript stream
  const { cursor } = useTranscriptStream({
    sessionId: selectedSession?.id || null,
    baseUrl: client.config.baseUrl,
    city: client.config.city,
    onMessageReceived: handleNewMessage,
    onTurnStarted: handleTurnStarted,
    onTurnCompleted: handleTurnCompleted,
    onTurnFailed: handleTurnFailed,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const rigsData = await client.getRigs();
      setRigs(rigsData);

      if (rigsData.length > 0 && !selectedRig) {
        setSelectedRig(rigsData[0].id);
        const sessionsData = await client.getSessions(rigsData[0].id);
        setSessions(sessionsData);
      }

      toast.show(`Loaded ${rigsData.length} rig(s)`, { variant: "success" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load data";
      toast.error(`Connection error: ${errorMsg}`);
      console.error("Failed to load rigs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRigSelect(rigId: string) {
    setSelectedRig(rigId);
    setSelectedSession(null);
    setMessages([]);
    setTab("sessions");
    try {
      const sessionsData = await client.getSessions(rigId);
      setSessions(sessionsData);
      toast.show(`Loaded ${sessionsData.length} session(s)`, { variant: "success" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load sessions";
      toast.error(errorMsg);
      console.error("Failed to load sessions:", err);
    }
  }

  async function handleSessionSelect(session: Session) {
    setSelectedSession(session);
    setTab("transcript");
    setLoadingTranscript(true);
    try {
      const snapshot = await client.getTranscriptSnapshot(session.id);
      setMessages(snapshot.messages || []);
      toast.show(`Loaded transcript: ${snapshot.messages?.length || 0} message(s)`, { variant: "success" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load transcript";
      toast.error(errorMsg);
      console.error("Failed to load transcript:", err);
    } finally {
      setLoadingTranscript(false);
    }
  }

  async function handleCreateSession() {
    if (!selectedRig) {
      toast.error("Please select a rig first");
      return;
    }
    try {
      const newSession = await client.createSession(selectedRig);
      setSessions([...sessions, newSession]);
      handleSessionSelect(newSession);
      toast.show("Session created successfully", { variant: "success" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create session";
      toast.error(errorMsg);
      console.error("Failed to create session:", err);
    }
  }

  // Handle sending a new message
  const handleSendMessage = useCallback(async (messageText: string, clientMessageId: string) => {
    if (!selectedSession) {
      toast.error("No session selected");
      return;
    }

    setSending(true);
    setTurnStatus("Sending message...");

    try {
      // Submit message to supervisor
      const result = await client.submitMessage(
        selectedSession.id,
        messageText,
        clientMessageId
      );

      console.log("Message submitted:", result.request_id, "turn:", result.turn_id);
      setTurnStatus(`Turn active: ${result.turn_id?.substring(0, 12) || "processing"}...`);
      toast.show("Message sent", { variant: "success" });

      // Optimistically add user message to transcript
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send message";
      toast.error(errorMsg);
      setTurnStatus("");
      console.error("Failed to send message:", err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [selectedSession, client, toast]);

  const renderSidebar = () => (
    <View style={[styles.sidebar, { borderColor: theme.colors.border }]}>
      <View style={styles.sidebarSection}>
        <Text style={[styles.sidebarTitle, { color: theme.colors.foreground }]}>Rigs</Text>
        {rigs.map((rig) => (
          <Pressable
            key={rig.id}
            style={[
              styles.sidebarItem,
              rig.id === selectedRig && styles.sidebarItemActive,
              { backgroundColor: rig.id === selectedRig ? theme.colors.surface2 : "transparent" },
            ]}
            onPress={() => handleRigSelect(rig.id)}
          >
            <Text style={[styles.sidebarItemName, { color: theme.colors.foreground }]}>{rig.name}</Text>
            <Text style={[styles.sidebarItemMeta, { color: theme.colors.foreground }]}>
              {rig.branch}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sidebarSection}>
        <Text style={[styles.sidebarTitle, { color: theme.colors.foreground }]}>
          Sessions ({sessions.length})
        </Text>
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            style={[
              styles.sidebarItem,
              selectedSession?.id === session.id && styles.sidebarItemActive,
              { backgroundColor: selectedSession?.id === session.id ? theme.colors.surface2 : "transparent" },
            ]}
            onPress={() => handleSessionSelect(session)}
          >
            <Text style={[styles.sidebarItemName, { color: theme.colors.foreground }]}>
              {session.name}
            </Text>
            <Text style={[styles.sidebarItemMeta, { color: theme.colors.foreground }]}>
              {session.state}
            </Text>
          </Pressable>
        ))}

        <Pressable style={styles.button} onPress={handleCreateSession}>
          <Text style={styles.buttonText}>+ New Session</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { borderColor: theme.colors.border }]}>
      <Pressable
        style={[
          styles.tab,
          tab === "sessions" && { borderBottomColor: theme.colors.primary },
        ]}
        onPress={() => setTab("sessions")}
      >
        <Text
          style={[
            styles.tabLabel,
            { color: tab === "sessions" ? theme.colors.primary : theme.colors.foreground },
          ]}
        >
          Sessions
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.tab,
          tab === "transcript" && { borderBottomColor: theme.colors.primary },
        ]}
        onPress={() => setTab("transcript")}
        disabled={!selectedSession}
      >
        <Text
          style={[
            styles.tabLabel,
            {
              color: tab === "transcript" ? theme.colors.primary : theme.colors.foreground,
              opacity: selectedSession ? 1 : 0.4,
            },
          ]}
        >
          Transcript
        </Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (tab === "sessions") {
      return (
        <ScrollView style={styles.mainContent}>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 16, color: theme.colors.foreground }}>
              Active Sessions
            </Text>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                style={[
                  { padding: 12, borderWidth: 1, borderRadius: 6, marginBottom: 8, borderColor: theme.colors.border },
                ]}
                onPress={() => handleSessionSelect(session)}
              >
                <Text style={{ fontSize: 14, fontWeight: "500", color: theme.colors.foreground }}>
                  {session.name}
                </Text>
                <Text style={{ fontSize: 12, opacity: 0.7, marginTop: 4, color: theme.colors.foreground }}>
                  State: {session.state}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (tab === "transcript") {
      if (!selectedSession) {
        return (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.foreground }]}>
              No Session Selected
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.foreground }]}>
              Select a session from the sidebar to view its transcript
            </Text>
          </View>
        );
      }

      return (
        <View style={{ flex: 1 }}>
          {/* Agent Avatar Header */}
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: theme.colors.border }}>
            <AgentAvatar
              name="Mayor"
              provider="Claude Code"
              model="claude-3.5-sonnet"
              isActive={true}
              theme={theme}
            />
            {turnStatus ? (
              <Text style={{ fontSize: 11, opacity: 0.6, marginTop: 4, color: theme.colors.foreground }}>
                {turnStatus}
              </Text>
            ) : null}
          </View>

          {/* Transcript Viewer */}
          <View style={{ flex: 1 }}>
            <TranscriptViewer
              messages={messages}
              theme={theme}
              isLoading={loadingTranscript}
              fontSize={settings.status === "ready" ? settings.values.transcriptFontSize : "medium"}
            />
          </View>

          {/* Message Composer */}
          <View style={{ borderTopWidth: 1, borderColor: theme.colors.border }}>
            <MessageComposer
              onSend={handleSendMessage}
              disabled={!selectedSession}
              loading={sending}
              theme={theme}
            />
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.foreground }}>Loading rigs and sessions...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.foreground }}>Gas City Studio</Text>
      </View>
      
      <View style={{ flex: 1, flexDirection: "row" }}>
        {renderSidebar()}
        <View style={{ flex: 1 }}>
          {renderTabBar()}
          {renderContent()}
        </View>
      </View>
    </View>
  );
}
