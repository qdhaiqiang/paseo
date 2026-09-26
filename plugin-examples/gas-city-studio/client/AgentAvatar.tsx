import { View, Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
  },
  status: {
    fontSize: 11,
  },
});

interface AgentAvatarProps {
  name: string;
  provider?: string;
  model?: string;
  isActive?: boolean;
  theme: any;
}

const AGENT_COLORS = {
  mayor: "#FF6B6B",
  dispatcher: "#4ECDC4",
  coder: "#95E1D3",
  reviewer: "#F38181",
  default: "#A8E6CF",
};

export function AgentAvatar({ name, provider, model, isActive, theme }: AgentAvatarProps) {
  const getColor = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("mayor")) return AGENT_COLORS.mayor;
    if (lowerName.includes("dispatch")) return AGENT_COLORS.dispatcher;
    if (lowerName.includes("code")) return AGENT_COLORS.coder;
    if (lowerName.includes("review")) return AGENT_COLORS.reviewer;
    return AGENT_COLORS.default;
  };

  const getInitials = () => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusText = () => {
    if (!isActive) return "Idle";
    return model ? `${provider || "Agent"} • ${model}` : `${provider || "Agent"}`;
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={[styles.avatarText, { color: "#fff" }]}>{getInitials()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.foreground }]}>{name}</Text>
        <Text
          style={[
            styles.status,
            {
              color: isActive ? theme.colors.primary : theme.colors.foreground,
              opacity: isActive ? 1 : 0.6,
            },
          ]}
        >
          {getStatusText()}
        </Text>
      </View>
      {isActive && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#34C759",
          }}
        />
      )}
    </View>
  );
}
