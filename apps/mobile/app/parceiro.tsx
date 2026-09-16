import { useState } from "react";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "../lib/api";

type Preview = {
  redemption_id: string;
  member_name?: string;
  benefit_title: string;
  expires_at: string;
};
export default function PartnerValidationScreen() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<Preview>();
  const [loading, setLoading] = useState(false);
  async function request(path: "preview" | "confirm") {
    setLoading(true);
    try {
      const result = await apiFetch<{ data?: Preview }>(
        `/api/partner/redemptions/${path}`,
        { method: "POST", body: JSON.stringify({ manual_code: code }) },
      );
      if (!result.data) throw new Error("Código inválido");
      if (path === "preview") setPreview(result.data);
      else {
        Alert.alert("Benefício confirmado", "O resgate foi registado.");
        setCode("");
        setPreview(undefined);
      }
    } catch (error) {
      Alert.alert(
        "Não foi possível validar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ÁREA DE PARCEIRO</Text>
      <Text style={styles.title}>Validar benefício</Text>
      <Text style={styles.body}>
        Introduza o código de 6 dígitos apresentado pelo membro.
      </Text>
      <TextInput
        value={code}
        onChangeText={(v) => {
          setCode(v.replace(/\D/g, "").slice(0, 6));
          setPreview(undefined);
        }}
        keyboardType="number-pad"
        placeholder="000000"
        style={styles.input}
      />
      <Pressable
        disabled={loading || code.length !== 6}
        onPress={() => void request("preview")}
        style={[
          styles.button,
          (loading || code.length !== 6) && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? "A verificar…" : "Verificar código"}
        </Text>
      </Pressable>
      {preview && (
        <View style={styles.card}>
          <Text style={styles.valid}>CÓDIGO VÁLIDO</Text>
          <Text style={styles.benefit}>{preview.benefit_title}</Text>
          <Text style={styles.member}>
            {preview.member_name ?? "Membro do Clube"}
          </Text>
          <Pressable
            disabled={loading}
            onPress={() => void request("confirm")}
            style={styles.confirm}
          >
            <Text style={styles.confirmText}>Confirmar utilização</Text>
          </Pressable>
        </View>
      )}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Voltar</Text>
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
  body: { marginTop: 12, color: "#5a6e5c", fontSize: 16, lineHeight: 24 },
  input: {
    marginTop: 24,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 18,
    textAlign: "center",
    color: "#243029",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 8,
  },
  button: {
    marginTop: 18,
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#b58b4a",
    paddingVertical: 15,
  },
  buttonText: { color: "#243029", fontWeight: "700" },
  disabled: { opacity: 0.45 },
  card: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "#243029",
    padding: 20,
  },
  valid: {
    color: "#b58b4a",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  benefit: { marginTop: 10, color: "#fff", fontSize: 22, fontWeight: "700" },
  member: { marginTop: 8, color: "#d7d2c6", fontSize: 14 },
  confirm: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#b58b4a",
    paddingVertical: 14,
  },
  confirmText: { color: "#243029", fontWeight: "700" },
  link: { marginTop: 24, color: "#743b40", fontWeight: "600" },
});
