import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 14,
  },
  sendButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  statusText: {
    fontSize: 11,
    fontStyle: "italic",
  },
});

interface MessageComposerProps {
  onSend: (message: string, clientMessageId: string) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  theme: any;
}

export function MessageComposer({ onSend, disabled, loading, theme }: MessageComposerProps) {
  const [text, setText] = useState("");

  const generateClientMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const handleSend = useCallback(async () => {
    if (!text.trim() || disabled || loading) return;

    const clientMessageId = generateClientMessageId();
    const messageText = text.trim();

    try {
      setText("");
      await onSend(messageText, clientMessageId);
    } catch (error) {
      // Error handling is done by parent component
      console.error("Failed to send message:", error);
    }
  }, [text, disabled, loading, onSend, generateClientMessageId]);

  const canSend = text.trim().length > 0 && !disabled && !loading;

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.foreground,
              backgroundColor: theme.colors.background,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.foreground + "80"}
          value={text}
          onChangeText={setText}
          multiline
          editable={!disabled && !loading}
          onSubmitEditing={(e) => {
            if (!e.nativeEvent.shiftKey) {
              handleSend();
            }
          }}
        />

        <Pressable
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.primary : theme.colors.surface2,
            },
            !canSend && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.sendButtonText, { color: canSend ? "#fff" : theme.colors.foreground }]}>
              Send
            </Text>
          )}
        </Pressable>
      </View>

      {loading && (
        <Text style={[styles.statusText, { color: theme.colors.foreground }]}>
          Sending message...
        </Text>
      )}
    </View>
  );
}
