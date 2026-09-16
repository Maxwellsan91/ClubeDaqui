import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../lib/auth";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarActiveTintColor: "#743b40" }}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="explorar" options={{ title: "Explorar" }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa" }} />
      <Tabs.Screen name="conta" options={{ title: "Conta" }} />
    </Tabs>
  );
}
