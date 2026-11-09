import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/constants/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  // Responsive: 1 kolom di layar sempit, 2 di tablet/lanskap, 3 di desktop lebar
  const columns = width < 480 ? 1 : width < 900 ? 2 : 3;
  // Orientasi lanskap di HP sempit tetap dapat grid 2 karena lebar bertambah

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section — Header, Judul, Informasi Utama */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Text
              style={styles.badgeText}
              accessible
              accessibilityLabel="Sampul: MoveMate, solusi pindahan terpercaya"
            >
              🚚 SOLUSI PINDAHAN TERPERCAYA
            </Text>
          </View>
          <Text
            style={styles.heroTitle}
            accessible
            accessibilityRole="header"
            accessibilityLabel="Pindahan Lebih Cepat, Aman dan Praktis"
          >
            Pindahan Lebih Cepat, Aman &amp; Praktis
          </Text>
          <Text style={styles.heroDesc}>
            MoveMate membantu mengatur transportasi, armada angkut, hingga
            pelacakan posisi barang secara langsung dari perangkatmu.
          </Text>

          <View style={styles.heroActionRow}>
            <Pressable
              style={[styles.primaryButton, columns === 1 && styles.fullWidthBtn]}
              onPress={() => router.push('/booking')}
              accessibilityRole="button"
              accessibilityLabel="Pesan pindahan sekarang"
              accessibilityHint="Membuka form pemesanan pemindahan barang"
            >
              <Text style={styles.primaryButtonText}>📦 Pesan Pindahan Sekarang</Text>
            </Pressable>

            <Pressable
              style={[styles.trackButton, columns === 1 && styles.fullWidthBtn]}
              onPress={() => router.push('/order')}
              accessibilityRole="button"
              accessibilityLabel="Lihat riwayat pesanan"
              accessibilityHint="Membuka daftar pesanan dan pengirimanmu"
            >
              <Text style={styles.trackButtonText}>📋 Riwayat Pesanan</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Menu Cards Grid */}
        <Text
          style={styles.sectionTitle}
          accessible
          accessibilityRole="header"
          accessibilityLabel="Layanan dan Fitur Utama"
        >
          Layanan &amp; Fitur Utama
        </Text>

        <View style={styles.grid}>
          {/* Card 1: Booking */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push('/booking')}
            accessibilityRole="button"
            accessibilityLabel="Pesan pengangkutan"
            accessibilityHint="Membuka langkah pemesanan: detail barang, lokasi, konfirmasi"
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                📦
              </Text>
            </View>
            <Text style={styles.cardTitle}>Pesan Pengangkutan</Text>
            <Text style={styles.cardDesc}>
              Tentukan jenis barang, armada dari API, berat, dan titik tujuan.
            </Text>
          </Pressable>

          {/* Card 2: Order */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push('/order')}
            accessibilityRole="button"
            accessibilityLabel="Riwayat pesanan"
            accessibilityHint="Melihat status pesanan dari server"
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#EDE7F6' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                📋
              </Text>
            </View>
            <Text style={styles.cardTitle}>Riwayat Pesanan</Text>
            <Text style={styles.cardDesc}>
              Lihat status pesanan live dari endpoint terproteksi.
            </Text>
          </Pressable>

          {/* Card 3: Maps */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push('/map')}
            accessibilityRole="button"
            accessibilityLabel="Titik lokasi maps"
            accessibilityHint="Memilih koordinat penjemputan dan tujuan pada peta"
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                🗺️
              </Text>
            </View>
            <Text style={styles.cardTitle}>Titik Lokasi Maps</Text>
            <Text style={styles.cardDesc}>
              Pilih koordinat penjemputan dan tujuan dengan akurat.
            </Text>
          </Pressable>

          {/* Card 4: Camera */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push('/camera')}
            accessibilityRole="button"
            accessibilityLabel="Kamera dokumentasi"
            accessibilityHint="Mengambil foto kondisi barang untuk dilampirkan ke pesanan"
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                📷
              </Text>
            </View>
            <Text style={styles.cardTitle}>Kamera Dokumentasi</Text>
            <Text style={styles.cardDesc}>
              Foto kondisi barang sebelum dan sesudah dipindahkan.
            </Text>
          </Pressable>

          {/* Card 5: Sensor */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push('/sensor')}
            accessibilityRole="button"
            accessibilityLabel="Sensor guncangan"
            accessibilityHint="Membuka akselerometer untuk memantau keamanan barang"
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#FCE4EC' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                📡
              </Text>
            </View>
            <Text style={styles.cardTitle}>Sensor Guncangan</Text>
            <Text style={styles.cardDesc}>
              Uji sensor Accelerometer untuk memantau keamanan barang rapuh.
            </Text>
          </Pressable>

          {/* Card 6: Akun */}
          <Pressable
            style={[styles.card, { flexBasis: `${100 / columns - 3}%` }]}
            onPress={() => router.push(user ? '/order' : '/login')}
            accessibilityRole="button"
            accessibilityLabel={user ? 'Lihat pesanan akunmu' : 'Akun dan keamanan'}
            accessibilityHint={
              user
                ? 'Membuka riwayat pesanan akun'
                : 'Membuka halaman masuk akun'
            }
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.cardIcon} accessible={false}>
                {user ? '👤' : '🔐'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>
              {user ? 'Pesanan Akunmu' : 'Akun & Keamanan'}
            </Text>
            <Text style={styles.cardDesc}>
              {user
                ? 'Lihat riwayat pesanan yang tersimpan di server.'
                : 'Masuk atau daftar untuk menyimpan pesanan di akunmu.'}
            </Text>
          </Pressable>
        </View>

        {/* Banner Akun atau Registrasi */}
        {user ? (
          <View
            style={[styles.regBanner, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}
          >
            <View style={styles.regTextCol}>
              <Text style={[styles.regTitle, { color: '#2E7D32' }]}>
                🟢 Akun Aktif: {user.name}
              </Text>
              <Text style={styles.regDesc}>
                Email: {user.email} • Siap membuat pesanan pindahan hari ini?
              </Text>
            </View>
            <Pressable
              style={[styles.regButton, { backgroundColor: '#2E7D32' }]}
              onPress={() => router.push('/booking')}
              accessibilityRole="button"
              accessibilityLabel="Mulai pesanan baru dengan akun ini"
            >
              <Text style={styles.regButtonText}>Mulai Pesanan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.regBanner}>
            <View style={styles.regTextCol}>
              <Text style={styles.regTitle}>⚠️ Belum Memiliki Akun?</Text>
              <Text style={styles.regDesc}>
                Daftar sekarang untuk kemudahan pemesanan — pesanan tersimpan
                aman di akunmu (Bearer Token).
              </Text>
            </View>
            <Pressable
              style={styles.regButton}
              onPress={() => router.push('/register')}
              accessibilityRole="button"
              accessibilityLabel="Daftar gratis sekarang"
              accessibilityHint="Membuka halaman pendaftaran akun"
            >
              <Text style={styles.regButtonText}>Daftar Gratis</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#173C67',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    color: '#90CAF9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroDesc: {
    color: '#D1E4F7',
    fontSize: 14,
    lineHeight: 22,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#1769AA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  trackButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  fullWidthBtn: {
    flexGrow: 0,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173C67',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 132,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173C67',
  },
  cardDesc: {
    fontSize: 13,
    color: '#596579',
    lineHeight: 18,
  },
  regBanner: {
    backgroundColor: '#EEF4FB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4E3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  regTextCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  regTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173C67',
  },
  regDesc: {
    fontSize: 13,
    color: '#596579',
    lineHeight: 18,
  },
  regButton: {
    backgroundColor: '#1769AA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 46,
    borderRadius: 10,
    justifyContent: 'center',
  },
  regButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
