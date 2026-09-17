import { useState } from "react";
import { Link, router } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Não foi possível entrar", error.message);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CLUBE DAQUI</Text>
      <Text style={styles.title}>Entrar na sua conta</Text>
      <Text style={styles.body}>Aceda aos seus benefícios e poupanças.</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        secureTextEntry
        placeholder="Palavra-passe"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable
        disabled={loading || !email || !password}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          (loading || !email || !password) && styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? "A entrar…" : "Entrar"}
        </Text>
      </Pressable>
      <Link href="/registar" style={styles.register}>
        Ainda não tem conta? Registe-se
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#f7f4ed",
  },
  eyebrow: {
    color: "#743b40",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: { marginTop: 14, color: "#243029", fontSize: 34, fontWeight: "700" },
  body: { marginTop: 12, color: "#5a6e5c", fontSize: 16 },
  input: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#243029",
    fontSize: 16,
  },
  button: {
    marginTop: 22,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#b58b4a",
    paddingVertical: 15,
  },
  buttonText: { color: "#243029", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  register: {
    marginTop: 22,
    textAlign: "center",
    color: "#743b40",
    fontSize: 14,
    fontWeight: "600",
  },
});
