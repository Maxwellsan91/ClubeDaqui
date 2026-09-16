import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function MemberHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ÁREA DE MEMBRO</Text>
      <Text style={styles.title}>Descubra o próximo lugar.</Text>
      <Text style={styles.body}>
        Explore parceiros locais e acompanhe as suas poupanças.
      </Text>
      <Link href="/(tabs)/explorar" style={styles.button}>
        Explorar parceiros
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
  title: { marginTop: 14, color: "#243029", fontSize: 36, fontWeight: "700" },
  body: { marginTop: 14, color: "#5a6e5c", fontSize: 16, lineHeight: 24 },
  button: {
    alignSelf: "flex-start",
    marginTop: 26,
    borderRadius: 24,
    backgroundColor: "#b58b4a",
    paddingHorizontal: 22,
    paddingVertical: 14,
    color: "#243029",
    fontSize: 15,
    fontWeight: "700",
  },
});
