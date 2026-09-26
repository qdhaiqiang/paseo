import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import {
  SupervisorClient,
  type Rig,
  type Session,
  type StructuredMessage,
} from "./api/supervisor";
import { TranscriptViewer } from "./TranscriptViewer";
import { AgentAvatar } from "./AgentAvatar";

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
  const [error, setError] = useState<string>("");

  // Initialize API client
  const client = new SupervisorClient({
    baseUrl: "http://localhost:8080",
    city: "main",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const rigsData = await client.getRigs();
      setRigs(rigsData);

      if (rigsData.length > 0 && !selectedRig) {
        setSelectedRig(rigsData[0].id);
        const sessionsData = await client.getSessions(rigsData[0].id);
        setSessions(sessionsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    }
  }

  async function handleSessionSelect(session: Session) {
    setSelectedSession(session);
    setTab("transcript");
    setLoadingTranscript(true);
    try {
      const snapshot = await client.getTranscriptSnapshot(session.id);
      setMessages(snapshot.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transcript");
    } finally {
      setLoadingTranscript(false);
    }
  }

  async function handleCreateSession() {
    if (!selectedRig) return;
    try {
      const newSession = await client.createSession(selectedRig);
      setSessions([...sessions, newSession]);
      handleSessionSelect(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  }

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
          </View>

          {/* Transcript Viewer */}
          <TranscriptViewer
            messages={messages}
            theme={theme}
            isLoading={loadingTranscript}
          />
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.foreground }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Text style={{ color: "#FF3B30", fontSize: 14 }}>Error: {error}</Text>
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
