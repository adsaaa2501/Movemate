import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Pressable,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { showConfirm } from '@/constants/alert';
import { useAuth } from '@/constants/auth-context';
import { ApiError } from '@/constants/api';
import {
  getOrders,
  cancelOrder as cancelOrderApi,
} from '@/constants/order-service';
import {
  type OrderInfo,
  type OrderStatus,
  formatRupiah,
} from '@/constants/dto';

// ─── Konfigurasi Status (ikon + teks → informasi TIDAK hanya lewat warna) ────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; warna: string; warnaText: string; ikon: string }
> = {
  menunggu: {
    label: 'Menunggu Konfirmasi',
    warna: '#FFF8E1',
    warnaText: '#E65100',
    ikon: '⏳',
  },
  dikonfirmasi: {
    label: 'Dikonfirmasi',
    warna: '#E3F2FD',
    warnaText: '#1565C0',
    ikon: '✅',
  },
  dalam_perjalanan: {
    label: 'Dalam Perjalanan',
    warna: '#EDE7F6',
    warnaText: '#4527A0',
    ikon: '📦',
  },
  selesai: {
    label: 'Selesai',
    warna: '#E8F5E9',
    warnaText: '#1B5E20',
    ikon: '🎉',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    warna: '#FFEBEE',
    warnaText: '#B71C1C',
    ikon: '❌',
  },
};

// ─── Filter Tab ─────────────────────────────────────────────────────────────

type FilterTab = 'semua' | 'aktif' | 'selesai';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'selesai', label: 'Selesai' },
];

const STATUS_AKTIF: OrderStatus[] = [
  'menunggu',
  'dikonfirmasi',
  'dalam_perjalanan',
];

// ─── Komponen Kartu Pesanan ─────────────────────────────────────────────────

function KartuPesanan({
  order,
  onBatalkan,
}: {
  order: OrderInfo;
  onBatalkan: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const bisaBatal = order.status === 'menunggu' || order.status === 'dikonfirmasi';

  return (
    <View style={styles.kartu}>
      {/* Header kartu */}
      <View style={styles.kartuHeader}>
        <View style={styles.kartuHeaderLeft}>
          <Text style={styles.kartuId}>{order.id.substring(0, 8).toUpperCase()}…</Text>
          <Text style={styles.kartuTanggal}>
            {new Date(order.tanggalPesan).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.warna }]}>
          <Text
            style={[styles.statusText, { color: cfg.warnaText }]}
            accessibilityLabel={`Status pesanan: ${cfg.label}`}
          >
            {cfg.ikon} {cfg.label}
          </Text>
        </View>
      </View>

      {/* Nama barang */}
      <Text style={styles.kartuNamaBarang}>{order.itemName}</Text>
      <Text style={styles.kartuBerat}>
        {order.weightKg} kg • {order.vehicleName}
      </Text>

      {/* Lokasi */}
      <View style={styles.lokasiRow}>
        <View style={styles.lokasiItem}>
          <Text style={styles.lokasiLabel}>📍 Penjemputan</Text>
          <Text style={styles.lokasiValue}>{order.pickup}</Text>
        </View>
        <View style={styles.lokasiArrow}>
          <Text style={styles.arrow}>→</Text>
        </View>
        <View style={styles.lokasiItem}>
          <Text style={styles.lokasiLabel}>🏁 Tujuan</Text>
          <Text style={styles.lokasiValue}>{order.destination}</Text>
        </View>
      </View>

      {/* Catatan */}
      {order.notes ? (
        <View style={styles.catatanBox}>
          <Text style={styles.catatanLabel}>Catatan:</Text>
          <Text style={styles.catatanValue}>{order.notes}</Text>
        </View>
      ) : null}

      {/* Jadwal */}
      <Text style={styles.jadwalText}>🗓️ Jadwal: {order.schedule}</Text>

      {/* Footer kartu */}
      <View style={styles.kartuFooter}>
        <View>
          <Text style={styles.biayaLabel}>Estimasi Biaya</Text>
          <Text style={styles.biayaValue}>{formatRupiah(order.estimasiBiaya)}</Text>
        </View>

        {bisaBatal && (
          <Pressable
            style={styles.batalBtn}
            onPress={() => onBatalkan(order.id)}
            accessibilityRole="button"
            accessibilityLabel={`Batalkan pesanan ${order.id}`}
            accessibilityHint="Mengubah status pesanan menjadi dibatalkan di server"
          >
            <Text style={styles.batalBtnText}>Batalkan</Text>
          </Pressable>
        )}

        {order.status === 'dalam_perjalanan' && (
          <Pressable
            style={styles.trackingBadge}
            onPress={() => router.push('/tracking')}
            accessibilityRole="button"
            accessibilityLabel="Lacak pengiriman live"
            accessibilityHint="Membuka halaman pelacakan armada"
          >
            <Text style={styles.trackingText}>🔴 Lacak Live →</Text>
          </Pressable>
        )}

        {order.status === 'selesai' && (
          <View style={[styles.trackingBadge, styles.selesaiBadge]}>
            <Text style={[styles.trackingText, styles.selesaiText]}>
              Terkirim ✓
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen Utama ───────────────────────────────────────────────────────────

export default function OrderScreen() {
  const { token, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [filter, setFilter] = useState<FilterTab>('semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<ApiError['type'] | ''>('');

  /** Ambil data dari GET /api/orders (Bearer Token). */
  async function fetchOrders() {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setErrorType('');
    try {
      const data = await getOrders(token);
      setOrders(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorType(err.type);
      } else {
        setError('Terjadi kesalahan saat memuat pesanan.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Muat ulang setiap kali layar ini tampil (mis. kembali dari booking)
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) void fetchOrders();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isLoading])
  );

  async function refreshOrders() {
    await fetchOrders();
  }

  // Batalkan pesanan → PATCH /api/orders/:id/status 'dibatalkan'
  function handleBatalkan(id: string) {
    if (!token) return;
    showConfirm(
      'Batalkan Pesanan?',
      'Pesanan yang sudah dibatalkan tidak dapat dikembalikan.',
      async () => {
        try {
          const updated = await cancelOrderApi(id, token);
          setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Gagal membatalkan pesanan. Coba lagi.'
          );
        }
      },
      'Ya, Batalkan',
      'Tidak'
    );
  }

  // Filter pesanan berdasarkan tab aktif
  const ordersTampil = orders.filter((o) => {
    if (filter === 'aktif') return STATUS_AKTIF.includes(o.status);
    if (filter === 'selesai')
      return o.status === 'selesai' || o.status === 'dibatalkan';
    return true;
  });

  // Statistik ringkas
  const totalAktif = orders.filter((o) => STATUS_AKTIF.includes(o.status)).length;
  const totalSelesai = orders.filter((o) => o.status === 'selesai').length;

  const harusLogin = !token;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.brand}>MoveMate</Text>
          <Text style={styles.title}>Riwayat Pesanan</Text>
          <Text style={styles.subtitle}>
            Data live dari protected endpoint GET /api/orders
          </Text>
        </View>
        <Pressable
          style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]}
          onPress={() => void refreshOrders()}
          disabled={loading || harusLogin}
          accessibilityRole="button"
          accessibilityLabel="Muat ulang daftar pesanan"
          accessibilityState={{ disabled: loading || harusLogin }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1769AA" />
          ) : (
            <Text style={styles.refreshIcon}>↻</Text>
          )}
        </Pressable>
      </View>

      {/* ── Kondisi belum login (Week 5: request tanpa token tidak diberi akses) */}
      {harusLogin ? (
        <ScrollView contentContainerStyle={styles.loginRequired}>
          <Text style={styles.loginRequiredIcon}>🔐</Text>
          <Text style={styles.loginRequiredTitle}>Masuk Diperlukan</Text>
          <Text style={styles.loginRequiredDesc}>
            Riwayat pesanan bersifat privat. Endpoint /api/orders menggunakan
            Bearer Token — tanpa token, server membalas 401 Unauthorized.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Masuk sekarang"
          >
            <Text style={styles.buttonText}>Masuk Sekarang</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <>
          {/* Statistik */}
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statAngka}>{totalAktif}</Text>
              <Text style={styles.statLabel}>Aktif</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statAngka}>{totalSelesai}</Text>
              <Text style={styles.statLabel}>Selesai</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statAngka}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Filter Tab */}
          <View style={styles.tabRow}>
            {FILTER_TABS.map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tab, filter === tab.key && styles.tabActive]}
                onPress={() => setFilter(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={`Filter ${tab.label}`}
                accessibilityState={{ selected: filter === tab.key }}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Error / Empty / List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => void fetchOrders()}
                tintColor="#1769AA"
                colors={['#1769AA']}
              />
            }
          >
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>
                  {errorType === 'network' ? '📡' : errorType === 'timeout' ? '⏱️' : '⚠️'}
                </Text>
                <Text style={styles.errorTitle}>
                  {errorType === 'network'
                    ? 'Tidak ada koneksi ke server'
                    : errorType === 'timeout'
                      ? 'Server tidak merespons'
                      : errorType === 'server'
                        ? 'Server sedang bermasalah'
                        : 'Permintaan ditolak'}
                </Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <Pressable
                  style={styles.retryBtn}
                  onPress={() => void fetchOrders()}
                  accessibilityRole="button"
                  accessibilityLabel="Coba muat ulang"
                >
                  <Text style={styles.retryText}>Coba Lagi</Text>
                </Pressable>
              </View>
            ) : loading && orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator color="#1769AA" />
                <Text style={styles.emptyDesc}>Memuat pesanan dari server…</Text>
              </View>
            ) : ordersTampil.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyJudul}>Belum Ada Pesanan</Text>
                <Text style={styles.emptyDesc}>
                  {filter === 'aktif'
                    ? 'Semua pesananmu sudah selesai.'
                    : filter === 'selesai'
                      ? 'Belum ada pesanan selesai.'
                      : 'Buat pesanan pindahan pertamamu sekarang.'}
                </Text>
                <Pressable
                  style={styles.button}
                  onPress={() => router.push('/booking')}
                  accessibilityRole="button"
                  accessibilityLabel="Buat pesanan pertama"
                >
                  <Text style={styles.buttonText}>Buat Pesanan Pertama</Text>
                </Pressable>
              </View>
            ) : (
              ordersTampil.map((o) => (
                <KartuPesanan key={o.id} order={o} onBatalkan={handleBatalkan} />
              ))
            )}

            {/* Tombol buat pesanan baru */}
            {ordersTampil.length > 0 && (
              <Pressable
                style={styles.button}
                onPress={() => router.push('/booking')}
                accessibilityRole="button"
                accessibilityLabel="Buat pesanan baru"
              >
                <Text style={styles.buttonText}>+ Buat Pesanan Baru</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.secondary}
              onPress={() => router.push('/')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>Kembali ke Beranda</Text>
            </Pressable>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brand: {
    color: '#1769AA',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: '#173C67',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#596579',
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF4FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnDisabled: {
    opacity: 0.6,
  },
  refreshIcon: {
    fontSize: 22,
    color: '#1769AA',
    fontWeight: '700',
  },

  // ── Kondisi harus login
  loginRequired: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  loginRequiredIcon: {
    fontSize: 52,
  },
  loginRequiredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173C67',
  },
  loginRequiredDesc: {
    fontSize: 14,
    color: '#596579',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Statistik
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statAngka: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1769AA',
  },
  statLabel: {
    fontSize: 12,
    color: '#596579',
    textAlign: 'center',
  },

  // ── Error box
  errorBox: {
    backgroundColor: '#FFF9F5',
    borderWidth: 1,
    borderColor: '#F3D8C8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: {
    fontSize: 42,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45900',
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: '#596579',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1769AA',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Tab filter
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
  },
  tabActive: {
    backgroundColor: '#1769AA',
    borderColor: '#1769AA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#596579',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── List / empty
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 54,
  },
  emptyJudul: {
    fontSize: 20,
    fontWeight: '700',
    color: '#173C67',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#596579',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // ── Kartu pesanan
  kartu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#173C67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  kartuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  kartuHeaderLeft: {
    flex: 1,
    minWidth: 120,
  },
  kartuId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173C67',
  },
  kartuTanggal: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  kartuNamaBarang: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
  },
  kartuBerat: {
    fontSize: 13,
    color: '#596579',
    marginTop: -6,
  },
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FA',
  },
  lokasiItem: {
    flex: 1,
    gap: 3,
  },
  lokasiArrow: {
    paddingTop: 14,
  },
  arrow: {
    color: '#A0AEC0',
    fontSize: 16,
  },
  lokasiLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  lokasiValue: {
    fontSize: 13,
    color: '#1A202C',
    lineHeight: 18,
  },
  catatanBox: {
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  catatanLabel: {
    fontSize: 12,
    color: '#596579',
    fontWeight: '600',
  },
  catatanValue: {
    fontSize: 13,
    color: '#1A202C',
    lineHeight: 18,
  },
  jadwalText: {
    fontSize: 13,
    color: '#1769AA',
    fontWeight: '600',
  },
  kartuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4FA',
    flexWrap: 'wrap',
    gap: 8,
  },
  biayaLabel: {
    fontSize: 12,
    color: '#596579',
  },
  biayaValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1769AA',
  },
  batalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E53935',
  },
  batalBtnText: {
    color: '#E53935',
    fontWeight: '600',
    fontSize: 13,
  },
  trackingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#EDE7F6',
  },
  trackingText: {
    color: '#4527A0',
    fontWeight: '700',
    fontSize: 13,
  },
  selesaiBadge: {
    backgroundColor: '#E8F5E9',
  },
  selesaiText: {
    color: '#1B5E20',
  },

  // ── Tombol
  button: {
    backgroundColor: '#1769AA',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondary: {
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#596579',
    fontSize: 14,
  },
});
