import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function MapWebScreen() {
  return (
    <View style={styles.container} accessibilityRole="none">
      <Text style={styles.icon} accessible accessibilityLabel="Simbol peta">
        🗺️
      </Text>
      <Text style={styles.title}>Peta MoveMate</Text>

      <Text style={styles.description}>
        Peta Google Maps interaktif tersedia di aplikasi Android/iOS melalui
        Expo Go (react-native-maps + expo-location).{'\n\n'}
        Pada versi web, titik penjemputan dan tujuan diisi berupa alamat teks
        di langkah &quot;Pilih Lokasi&quot; pada halaman pesanan.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push('/booking')}
        accessibilityRole="button"
        accessibilityLabel="Lanjut ke halaman pesanan untuk mengisi alamat"
        accessibilityHint="Membuka form pemesanan MoveMate"
      >
        <Text style={styles.buttonText}>Isi Alamat di Halaman Pesanan →</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={styles.secondary}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
      >
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: '#F7F8FA',
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    color: '#173C67',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
    color: '#596579',
    lineHeight: 23,
    maxWidth: 480,
  },
  button: {
    backgroundColor: '#1769AA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondary: {
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: '#1769AA',
    fontWeight: '700',
  },
});
