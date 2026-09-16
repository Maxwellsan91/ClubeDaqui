import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "../../lib/api";

type Detail = {
  id: string;
  name: string;
  kind?: string;
  city?: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  businessLocationId?: string;
};
type Benefit = {
  id: string;
  title: string;
  description?: string;
  terms?: string;
};

export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [detail, setDetail] = useState<Detail>();
  const [benefit, setBenefit] = useState<Benefit>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;
    apiFetch<{ data?: Detail }>(`/api/businesses/${slug}`)
      .then(async (payload) => {
        if (!payload.data) return;
        setDetail(payload.data);
        const benefits = await apiFetch<{ data?: Benefit[] }>(
          `/api/businesses/${payload.data.id}/benefits`,
        );
        setBenefit(benefits.data?.[0]);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [slug]);
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#743b40" />
      </View>
    );
  if (!detail)
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Estabelecimento não encontrado</Text>
        <Link href="/(tabs)/explorar" style={styles.link}>
          Voltar a explorar
        </Link>
      </View>
    );
  const mapsUrl =
    detail.latitude && detail.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${detail.latitude},${detail.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detail.name}, ${detail.address ?? detail.city ?? ""}`)}`;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>
        {detail.kind ?? "PARCEIRO"} · {detail.city}
      </Text>
      <Text style={styles.title}>{detail.name}</Text>
      <Text style={styles.address}>{detail.address}</Text>
      <Text style={styles.body}>
        {detail.description ?? "Descubra este parceiro do Clube Ribatejo."}
      </Text>
      <Pressable
        onPress={() => void Linking.openURL(mapsUrl)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Abrir no Google Maps</Text>
      </Pressable>
      {benefit && (
        <View style={styles.benefit}>
          <Text style={styles.eyebrow}>BENEFÍCIO CLUBE</Text>
          <Text style={styles.benefitTitle}>{benefit.title}</Text>
          {benefit.description && (
            <Text style={styles.body}>{benefit.description}</Text>
          )}
          <Text style={styles.note}>
            O resgate mobile será ativado na próxima etapa.
          </Text>
        </View>
      )}
      <Link href="/(tabs)/explorar" style={styles.link}>
        ← Voltar a explorar
      </Link>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 70,
    backgroundColor: "#f7f4ed",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f4ed",
  },
  eyebrow: {
    color: "#743b40",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    marginTop: 14,
    color: "#243029",
    fontSize: 34,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  address: { marginTop: 8, color: "#5a6e5c", fontSize: 14 },
  body: { marginTop: 18, color: "#5a6e5c", fontSize: 16, lineHeight: 24 },
  button: {
    marginTop: 24,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#243029",
    paddingVertical: 15,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  benefit: {
    marginTop: 28,
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
  },
  benefitTitle: {
    marginTop: 10,
    color: "#243029",
    fontSize: 22,
    fontWeight: "700",
  },
  note: { marginTop: 14, color: "#743b40", fontSize: 13, fontWeight: "600" },
  link: { marginTop: 24, color: "#743b40", fontSize: 15, fontWeight: "600" },
});
