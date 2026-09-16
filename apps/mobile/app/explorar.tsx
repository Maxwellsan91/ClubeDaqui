import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EXPLORAR</Text>
      <Text style={styles.title}>Lugares do Ribatejo</Text>
      <Text style={styles.body}>O catálogo mobile será ligado à API na próxima fase.</Text>
      <Link href="/" style={styles.link}>Voltar ao início</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, paddingTop: 70, backgroundColor: '#f7f4ed' },
  eyebrow: { color: '#743b40', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 14, color: '#243029', fontSize: 32, fontWeight: '700' },
  body: { marginTop: 14, color: '#5a6e5c', fontSize: 16, lineHeight: 24 },
  link: { marginTop: 26, color: '#743b40', fontSize: 15, fontWeight: '700' },
});
