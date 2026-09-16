import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../lib/auth";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarActiveTintColor: "#743b40" }}
    />
  );
}
