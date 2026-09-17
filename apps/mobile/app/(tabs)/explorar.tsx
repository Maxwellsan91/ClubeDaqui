import { useEffect, useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "../../lib/api";

type Place = { slug: string; name: string; kind: string; city: string };
const fallback: Place[] = [
  {
    slug: "a-tasca-do-bronze",
    name: "A Tasca do Bronze",
    kind: "Restaurante",
    city: "Almeirim",
  },
  {
    slug: "a-adega",
    name: "A Adega",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
  },
  {
    slug: "adega-novo-conceito",
    name: "Adega Novo Conceito",
    kind: "Adega",
    city: "Fazendas de Almeirim",
  },
];

export default function ExploreTab() {
  const [places, setPlaces] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch<{ data?: Place[] }>("/api/businesses")
      .then((payload) => {
        if (payload.data?.length) setPlaces(payload.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EXPLORAR</Text>
      <Text style={styles.title}>Lugares Daqui</Text>
      {loading && <ActivityIndicator color="#743b40" style={styles.loader} />}
      <FlatList
        data={places}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/explorar/${item.slug}`} style={styles.card}>
            <Text style={styles.kind}>{item.kind}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.city}>{item.city}</Text>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 22,
    backgroundColor: "#f7f4ed",
  },
  eyebrow: {
    color: "#743b40",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: { marginTop: 12, color: "#243029", fontSize: 32, fontWeight: "700" },
  loader: { marginTop: 16, alignSelf: "flex-start" },
  list: { gap: 12, paddingVertical: 22 },
  card: { borderRadius: 18, backgroundColor: "#fff", padding: 18 },
  kind: {
    color: "#743b40",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: { marginTop: 6, color: "#243029", fontSize: 19, fontWeight: "700" },
  city: { marginTop: 4, color: "#5a6e5c", fontSize: 13 },
});
