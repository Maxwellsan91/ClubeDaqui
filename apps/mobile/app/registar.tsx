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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Não foi possível criar a conta", error.message);
      return;
    }
    Alert.alert(
      "Confirme o seu email",
      "Enviámos um link de confirmação para o seu email.",
      [{ text: "Continuar", onPress: () => router.replace("/login") }],
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CLUBE RIBATEJO</Text>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.body}>
        Junte-se ao Clube e descubra benefícios locais.
      </Text>
      <TextInput
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
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
        placeholder="Palavra-passe (mín. 8 caracteres)"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Pressable
        disabled={loading || !name || !email || password.length < 8}
        onPress={() => void submit()}
        style={[
          styles.button,
          (loading || !name || !email || password.length < 8) &&
            styles.disabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? "A criar…" : "Criar conta"}
        </Text>
      </Pressable>
      <Link href="/login" style={styles.link}>
        Já tenho conta
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
    marginTop: 16,
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
  disabled: { opacity: 0.45 },
  link: {
    marginTop: 22,
    textAlign: "center",
    color: "#743b40",
    fontWeight: "600",
  },
});
