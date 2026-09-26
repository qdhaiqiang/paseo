import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { SupervisorClient, type Rig, type Session } from "./api/supervisor";

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  item: { padding: 12, borderWidth: 1, borderRadius: 6, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: "500" },
  itemMeta: { fontSize: 12, opacity: 0.7, marginTop: 4 },
  button: { padding: 12, backgroundColor: "#007AFF", borderRadius: 6, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  loading: { padding: 16, textAlign: "center" },
  error: { padding: 16, color: "#FF3B30" },
});

export function GasCityStudioPanel({ theme }: Pick<PluginSurfaceProps, "theme">) {
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedRig, setSelectedRig] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Initialize API client (use default config for now)
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
    try {
      const sessionsData = await client.getSessions(rigId);
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    }
  }

  async function handleCreateSession() {
    if (!selectedRig) return;
    try {
      const newSession = await client.createSession(selectedRig);
      setSessions([...sessions, newSession]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  }

  if (loading) {
    return <Text style={styles.loading}>Loading Gas City Studio...</Text>;
  }

  if (error) {
    return <Text style={styles.error}>Error: {error}</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.foreground }]}>
        Gas City Studio
      </Text>

      {/* Rigs Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Rigs ({rigs.length})
        </Text>
        {rigs.map((rig) => (
          <Pressable
            key={rig.id}
            style={[
              styles.item,
              {
                borderColor: rig.id === selectedRig ? "#007AFF" : theme.colors.border,
                backgroundColor: rig.id === selectedRig ? theme.colors.surface2 : "transparent",
              },
            ]}
            onPress={() => handleRigSelect(rig.id)}
          >
            <Text style={[styles.itemName, { color: theme.colors.foreground }]}>{rig.name}</Text>
            <Text style={[styles.itemMeta, { color: theme.colors.foreground }]}>
              {rig.branch} • {rig.path}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sessions Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Sessions ({sessions.length})
        </Text>
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            style={[styles.item, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.itemName, { color: theme.colors.foreground }]}>
              {session.name}
            </Text>
            <Text style={[styles.itemMeta, { color: theme.colors.foreground }]}>
              {session.state}
            </Text>
          </Pressable>
        ))}

        <Pressable style={styles.button} onPress={handleCreateSession}>
          <Text style={styles.buttonText}>Create New Session</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
