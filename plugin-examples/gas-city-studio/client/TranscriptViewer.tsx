import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import type { StructuredMessage, MessageBlock } from "./api/supervisor";

const styles = StyleSheet.create({
  container: { flex: 1 },
  messageContainer: { padding: 12, borderBottomWidth: 1 },
  userMessage: { backgroundColor: "#f0f0f0" },
  assistantMessage: { backgroundColor: "#ffffff" },
  systemMessage: { backgroundColor: "#fff9e6" },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  roleLabel: { fontSize: 12, fontWeight: "600" },
  timestamp: { fontSize: 10, opacity: 0.6 },
  modelLabel: { fontSize: 10, fontStyle: "italic", opacity: 0.7 },
  textBlock: { fontSize: 14, lineHeight: 20 },
  toolBlock: { padding: 8, backgroundColor: "#f5f5f5", borderRadius: 4, marginTop: 4 },
  toolName: { fontSize: 12, fontWeight: "600", fontFamily: "monospace" },
  partialIndicator: { fontSize: 10, fontStyle: "italic", opacity: 0.6, marginTop: 4 },
  loadingContainer: { padding: 32, alignItems: "center" },
});

interface TranscriptViewerProps {
  messages: StructuredMessage[];
  theme: any;
  isLoading?: boolean;
}

export function TranscriptViewer({ messages, theme, isLoading }: TranscriptViewerProps) {
  const getMessageStyle = (role: string) => {
    switch (role) {
      case "user":
        return styles.userMessage;
      case "assistant":
        return styles.assistantMessage;
      case "system":
        return styles.systemMessage;
      default:
        return styles.assistantMessage;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "user":
        return "#007AFF";
      case "assistant":
        return "#34C759";
      case "system":
        return "#FF9500";
      default:
        return theme.colors.foreground;
    }
  };

  const renderBlock = (block: MessageBlock, index: number) => {
    switch (block.kind) {
      case "text":
        return (
          <Text key={index} style={[styles.textBlock, { color: theme.colors.foreground }]}>
            {block.text}
          </Text>
        );

      case "tool_use":
        return (
          <View key={index} style={styles.toolBlock}>
            <Text style={[styles.toolName, { color: theme.colors.foreground }]}>
              🔧 {block.name || "Unknown Tool"}
            </Text>
            {block.input && (
              <Text style={{ fontSize: 11, color: theme.colors.foreground, opacity: 0.7 }}>
                Input: {JSON.stringify(block.input, null, 2)}
              </Text>
            )}
          </View>
        );

      case "tool_result":
        return (
          <View key={index} style={[styles.toolBlock, { backgroundColor: "#e8f5e9" }]}>
            <Text style={[styles.toolName, { color: "#2e7d32" }]}>
              ✅ Result
            </Text>
            {block.output && (
              <Text style={{ fontSize: 11, color: "#2e7d32" }}>
                {typeof block.output === "string" ? block.output : JSON.stringify(block.output)}
              </Text>
            )}
          </View>
        );

      case "file":
        return (
          <View key={index} style={styles.toolBlock}>
            <Text style={[styles.toolName, { color: theme.colors.foreground }]}>
              📄 {block.file_path || "File"}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.foreground }}>
          Loading transcript...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageContainer,
            getMessageStyle(message.role),
            { borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.messageHeader}>
            <Text style={[styles.roleLabel, { color: getRoleColor(message.role) }]}>
              {message.role === "user" ? "👤 User" : message.role === "assistant" ? "🤖 Assistant" : "⚙️ System"}
            </Text>
            {message.timestamp && (
              <Text style={[styles.timestamp, { color: theme.colors.foreground }]}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            )}
          </View>

          {message.model && (
            <Text style={[styles.modelLabel, { color: theme.colors.foreground }]}>
              Model: {message.model}
            </Text>
          )}

          {message.blocks.map((block, index) => renderBlock(block, index))}

          {message.status === "partial" && (
            <Text style={styles.partialIndicator}>Streaming...</Text>
          )}

          {message.client_message_id && (
            <Text style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>
              msg: {message.client_message_id}
            </Text>
          )}

          {message.turn_id && (
            <Text style={{ fontSize: 9, opacity: 0.5 }}>
              turn: {message.turn_id}
            </Text>
          )}
        </View>
      ))}

      {isLoading && messages.length > 0 && (
        <View style={{ padding: 16, alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
    </ScrollView>
  );
}
