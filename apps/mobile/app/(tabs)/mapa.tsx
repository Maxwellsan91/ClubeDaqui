import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { apiFetch } from "../../lib/api";

type Place = {
  slug: string;
  name: string;
  latitude?: number;
  longitude?: number;
};
const initial: Region = {
  latitude: 39.2028,
  longitude: -8.6281,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};
export default function MapTab() {
  const [region, setRegion] = useState(initial);
  const [places, setPlaces] = useState<Place[]>([]);
  const [permission, setPermission] = useState<"loading" | "ready" | "denied">(
    "loading",
  );
  useEffect(() => {
    apiFetch<{ data?: Place[] }>("/api/businesses")
      .then((r) => setPlaces(r.data ?? []))
      .catch(() => undefined);
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermission("denied");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRegion((r) => ({
        ...r,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));
      setPermission("ready");
    })();
  }, []);
  return (
    <View style={styles.container}>
      {permission === "loading" && (
        <ActivityIndicator style={styles.loader} color="#743b40" />
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={permission === "ready"}
        showsMyLocationButton
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="A sua localização"
          pinColor="#743b40"
        />
        {places
          .filter(
            (p) =>
              typeof p.latitude === "number" && typeof p.longitude === "number",
          )
          .map((p) => (
            <Marker
              key={p.slug}
              coordinate={{
                latitude: p.latitude as number,
                longitude: p.longitude as number,
              }}
              title={p.name}
            />
          ))}
      </MapView>
      {permission === "denied" && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Ative a localização para ver a sua posição.
          </Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { position: "absolute", zIndex: 2, top: 20, alignSelf: "center" },
  notice: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 14,
    backgroundColor: "#243029",
    padding: 14,
  },
  noticeText: { color: "#fff", textAlign: "center", fontSize: 13 },
});
