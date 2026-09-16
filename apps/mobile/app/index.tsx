import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CLUBE RIBATEJO</Text>
      <Text style={styles.title}>Descubra o que é nosso.</Text>
      <Text style={styles.body}>
        A app mobile está pronta para receber a experiência de descoberta,
        benefícios e poupanças do Clube.
      </Text>
      <Link href="/explorar" style={styles.button}>
        Começar a explorar
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#f7f4ed' },
  eyebrow: { color: '#743b40', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 14, color: '#243029', fontSize: 38, fontWeight: '700', lineHeight: 44 },
  body: { marginTop: 16, color: '#5a6e5c', fontSize: 16, lineHeight: 24 },
  button: { alignSelf: 'flex-start', marginTop: 28, borderRadius: 24, backgroundColor: '#b58b4a', paddingHorizontal: 22, paddingVertical: 14, color: '#243029', fontSize: 15, fontWeight: '700' },
});
