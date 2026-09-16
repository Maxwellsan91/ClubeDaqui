import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function AccountTab() {
  const { session, signOut } = useAuth();
  const [summary, setSummary] = useState<{
    usedBenefits: number;
    subscriptionPrice?: number;
    subscriptionStatus: string;
  }>();
  const [saved, setSaved] = useState(0);
  useEffect(() => {
    apiFetch<{ data?: typeof summary }>("/api/me/summary")
      .then((r) => setSummary(r.data))
      .catch(() => undefined);
    apiFetch<{ data?: { records?: { discountAmount: number }[] } }>(
      "/api/me/savings",
    )
      .then((r) =>
        setSaved(
          (r.data?.records ?? []).reduce(
            (sum, item) => sum + item.discountAmount,
            0,
          ),
        ),
      )
      .catch(() => undefined);
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CONTA</Text>
      <Text style={styles.title}>A sua área</Text>
      <Text style={styles.email}>{session?.user.email}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>POUPANÇA ACUMULADA</Text>
        <Text style={styles.amount}>{saved.toFixed(0)} €</Text>
        <Text style={styles.meta}>
          Subscrição: {(summary?.subscriptionPrice ?? 59).toFixed(0)} €
        </Text>
      </View>
      <Pressable onPress={() => void signOut()} style={styles.button}>
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    paddingTop: 70,
    backgroundColor: "#f7f4ed",
  },
  eyebrow: {
    color: "#743b40",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: { marginTop: 14, color: "#243029", fontSize: 34, fontWeight: "700" },
  email: { marginTop: 10, color: "#5a6e5c", fontSize: 16 },
  card: {
    marginTop: 28,
    borderRadius: 22,
    backgroundColor: "#243029",
    padding: 22,
  },
  cardLabel: {
    color: "#b58b4a",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  amount: { marginTop: 8, color: "#fff", fontSize: 38, fontWeight: "700" },
  meta: { marginTop: 8, color: "#d7d2c6", fontSize: 13 },
  button: {
    alignSelf: "flex-start",
    marginTop: 28,
    borderRadius: 22,
    backgroundColor: "#243029",
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
