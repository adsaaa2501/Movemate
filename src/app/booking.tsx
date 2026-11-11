import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { showMessage } from '@/constants/alert';
import { useAuth } from '@/constants/auth-context';
import { ApiError } from '@/constants/api';
import { getVehicles, createOrder } from '@/constants/order-service';
import { consumeLocationSelection } from '@/constants/location-store';
import {
  type VehicleInfo,
  type OrderInfo,
  formatRupiah,
} from '@/constants/dto';
import { type AttachedPhoto, consumePhotoForOrder } from '@/constants/photo-store';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Step = 'detail' | 'lokasi' | 'konfirmasi';

const MALANG_CENTER: Region = {
  latitude: -7.9666,
  longitude: 112.6326,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const STEP_LABELS: Record<Step, string> = {
  detail: '1. Detail Barang',
  lokasi: '2. Pilih Lokasi',
  konfirmasi: '3. Konfirmasi',
};

/** Ubah teks "lat, lng" menjadi koordinat valid, atau null. */
function parseCoordinate(raw: unknown): Coordinate | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const [lat, lng] = raw.split(',').map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

/** Ubah koordinat menjadi teks "lat, lng" (dipakai saat membuka Peta). */
function formatCoordinate(coord: Coordinate): string {
  return `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
}

/** Indikator 3 langkah form (hoisted — bukan komponen di dalam render). */
function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['detail', 'lokasi', 'konfirmasi'];
  return (
    <View style={styles.stepRow}>
      {steps.map((s, i) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              s === current && styles.stepDotActive,
              steps.indexOf(current) > i && styles.stepDotDone,
            ]}
          >
            <Text
              style={[
                styles.stepDotText,
                (s === current || steps.indexOf(current) > i) &&
                  styles.stepDotTextActive,
              ]}
            >
              {i + 1}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                steps.indexOf(current) > i && styles.stepLineDone,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

/** Baris ringkasan konfirmasi (hoisted). */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function BookingScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{
    pickup?: string;
    destination?: string;
  }>();

  // Titik dari halaman Peta langsung jadi data awal (Week 7 — maps ↔ booking)
  const hasPrefill =
    (typeof params.pickup === 'string' && !!params.pickup) ||
    (typeof params.destination === 'string' && !!params.destination);
  const [step, setStep] = useState<Step>(() => (hasPrefill ? 'lokasi' : 'detail'));
  const [itemName, setItemName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [pickup, setPickup] = useState<string>(() =>
    typeof params.pickup === 'string' ? params.pickup : ''
  );
  const [destination, setDestination] = useState<string>(() =>
    typeof params.destination === 'string' ? params.destination : ''
  );
  const [schedule, setSchedule] = useState('');
  const [pickupCoord, setPickupCoord] = useState<Coordinate | null>(() =>
    parseCoordinate(params.pickup)
  );
  const [destinationCoord, setDestinationCoord] = useState<Coordinate | null>(() =>
    parseCoordinate(params.destination)
  );
  const [pickingPoint, setPickingPoint] = useState<'origin' | 'destination'>('origin');

  // Referensi peta kecil untuk memusat ke titik terpilih (Week 7)
  const mapRef = useRef<MapView | null>(null);

  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState('');

  // Foto dari halaman Kamera dibaca sekali saat layar pertama dibuka (Week 7)
  const [photo, setPhoto] = useState<AttachedPhoto | null>(() =>
    consumePhotoForOrder()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Muat data armada dari API (Week 4 — data tidak lagi hard-code)
  useEffect(() => {
    let cancelled = false;
    getVehicles()
      .then((list) => {
        if (cancelled) return;
        setVehicles(list);
        setVehicleId((current) => current || list[0]?.id || '');
        setVehicleError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVehicleError(
          err instanceof ApiError ? err.message : 'Gagal memuat armada.'
        );
      })
      .finally(() => {
        if (!cancelled) setVehicleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshVehicles() {
    setVehicleLoading(true);
    setVehicleError('');
    try {
      const list = await getVehicles();
      setVehicles(list);
      setVehicleId((current) => current || list[0]?.id || '');
    } catch (err) {
      setVehicleError(
        err instanceof ApiError ? err.message : 'Gagal memuat armada.'
      );
    } finally {
      setVehicleLoading(false);
    }
  }

  // Saat kembali fokus (dari halaman Peta yang dibuka dengan "Buka Peta
  // Penuh"), ambil hasil pemilihan titik yang dikirim balik (Week 7).
  useFocusEffect(
    useCallback(() => {
      const selection = consumeLocationSelection();
      if (!selection) return;
      if (selection.pickup) {
        setPickup(selection.pickup);
        setPickupCoord(parseCoordinate(selection.pickup));
      }
      if (selection.destination) {
        setDestination(selection.destination);
        setDestinationCoord(parseCoordinate(selection.destination));
      }
      setError('');
      // pesan validasi lama ikut dibersihkan saat kembali dari Peta
    }, [])
  );

  const berat = parseFloat(weightKg.replace(',', '.'));
  const pickedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const hargaEstimasi =
    pickedVehicle && Number.isFinite(berat) && berat > 0
      ? pickedVehicle.price + berat * 5000
      : 0;

  // ─── Validasi per-step ──────────────────────────────────────────────────────
  function validateDetail(): boolean {
    if (!itemName.trim()) {
      setError('Nama barang tidak boleh kosong.');
      return false;
    }
    if (!weightKg.trim()) {
      setError('Berat barang tidak boleh kosong.');
      return false;
    }
    if (isNaN(berat) || berat <= 0) {
      setError('Berat barang harus berupa angka positif.');
      return false;
    }
    if (!schedule.trim()) {
      setError('Jadwal pindahan wajib diisi, contoh: 2026-11-12 08:00.');
      return false;
    }
    return true;
  }

  function validateLokasi(): boolean {
    if (!pickup.trim()) {
      setError('Titik penjemputan belum dipilih. Ketuk peta untuk memilih.');
      return false;
    }
    if (!destination.trim()) {
      setError('Titik tujuan belum dipilih. Ketuk peta untuk memilih.');
      return false;
    }
    return true;
  }

  function goNext() {
    setError('');
    if (step === 'detail' && validateDetail()) setStep('lokasi');
    else if (step === 'lokasi' && validateLokasi()) setStep('konfirmasi');
  }

  function goBack() {
    setError('');
    if (step === 'konfirmasi') setStep('lokasi');
    else if (step === 'lokasi') setStep('detail');
    else router.back();
  }

  // ─── Handler tap peta → koordinat + teks "lat, lng" ────────────────────────
  function handleMapPress(event: MapPressEvent) {
    const coord = event.nativeEvent.coordinate;
    const label = `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
    if (pickingPoint === 'origin') {
      setPickupCoord(coord);
      setPickup(label);
    } else {
      setDestinationCoord(coord);
      setDestination(label);
    }
    if (error) setError('');
  }

  // Peta kecil otomatis memusat ke titik terbaru — baik hasil tap langsung
  // maupun hasil yang dikembalikan halaman Peta penuh (Week 7).
  useEffect(() => {
    const target = pickupCoord ?? destinationCoord;
    if (!target) return;
    mapRef.current?.animateToRegion(
      {
        ...MALANG_CENTER,
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      400
    );
  }, [pickupCoord, destinationCoord]);

  // ─── Submit Pemesanan → POST /api/orders (Bearer Token, Week 5) ────────────
  async function handleSubmit() {
    setError('');
    if (!token) {
      setError('Kamu belum login. Masuk terlebih dahulu untuk membuat pesanan.');
      return;
    }
    setLoading(true);
    try {
      const order: OrderInfo = await createOrder(
        {
          itemName: itemName.trim(),
          weightKg: berat,
          notes: notes.trim(),
          pickup: pickup.trim(),
          destination: destination.trim(),
          vehicleId: vehicleId || pickedVehicle?.id || '',
          vehicleName: pickedVehicle?.name ?? '',
          schedule: schedule.trim(),
          photoNote: Boolean(photo),
        },
        token
      );

      showMessage(
        'Pesanan Berhasil! 🎉',
        `Kode pesanan ${order.id} telah dikirim ke server.\nJadwal: ${order.schedule}.`,
        () => router.replace('/order')
      );
      setStep('detail');
      setItemName('');
      setWeightKg('');
      setNotes('');
      setPickup('');
      setDestination('');
      setSchedule('');
      setPickupCoord(null);
      setDestinationCoord(null);
      setPhoto(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.type === 'unauthorized'
            ? 'Sesi berakhir atau tidak valid. Silakan login kembali.'
            : err.message
        );
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Render: Step Detail Barang ────────────────────────────────────────────
  const renderDetail = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>{STEP_LABELS.detail}</Text>
      <Text style={styles.stepDesc}>
        Isi informasi barang yang akan dipindahkan beserta jadwalnya.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nama Barang *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Lemari, Sofa, Kardus"
          placeholderTextColor="#A0AEC0"
          value={itemName}
          onChangeText={(text) => {
            setItemName(text);
            if (error) setError('');
          }}
          accessibilityLabel="Nama barang, wajib diisi"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Estimasi Berat (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 25"
          placeholderTextColor="#A0AEC0"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={(text) => {
            setWeightKg(text);
            if (error) setError('');
          }}
          accessibilityLabel="Estimasi berat dalam kilogram, wajib diisi"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Jadwal Pindahan *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 2026-11-12 08:00"
          placeholderTextColor="#A0AEC0"
          autoCapitalize="none"
          value={schedule}
          onChangeText={(text) => {
            setSchedule(text);
            if (error) setError('');
          }}
          accessibilityLabel="Jadwal pindahan, wajib diisi"
          accessibilityHint="Format tahun-bulan-tanggal jam:menit"
        />
      </View>

      {/* Pilihan armada dari API */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Armada *</Text>
        {vehicleLoading ? (
          <View style={styles.vehicleLoading}>
            <ActivityIndicator color="#1769AA" />
            <Text style={styles.vehicleLoadingText}>
              Memuat armada dari server…
            </Text>
          </View>
        ) : vehicleError ? (
          <View style={styles.vehicleErrorBox}>
            <Text style={styles.vehicleErrorText}>📡 {vehicleError}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => void refreshVehicles()}
              accessibilityRole="button"
              accessibilityLabel="Muat ulang data armada"
            >
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.vehicleRow}>
            {vehicles.map((v) => (
              <Pressable
                key={v.id}
                style={[styles.vehicleBtn, vehicleId === v.id && styles.vehicleBtnActive]}
                onPress={() => setVehicleId(v.id)}
                accessibilityRole="radio"
                accessibilityLabel={`Armada ${v.name}, harga dasar ${formatRupiah(v.price)}`}
                accessibilityState={{
                  selected: vehicleId === v.id,
                }}
                accessibilityHint="Menjadikan armada ini pilihan pesanan"
              >
                <Text
                  style={[
                    styles.vehicleName,
                    vehicleId === v.id && styles.vehicleTextActive,
                  ]}
                >
                  🚐 {v.name}
                </Text>
                <Text
                  style={[
                    styles.vehiclePrice,
                    vehicleId === v.id && styles.vehicleTextActive,
                  ]}
                >
                  {formatRupiah(v.price)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Catatan Tambahan</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Contoh: Barang fragile, perlu pengepakan ekstra"
          placeholderTextColor="#A0AEC0"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Catatan tambahan, opsional"
        />
      </View>
    </View>
  );

  // ─── Render: Step Lokasi (tap peta + prefill dari halaman Peta) ─────────────
  const renderLokasi = () => (
    <View style={styles.mapSection}>
      <Text style={styles.stepTitle}>{STEP_LABELS.lokasi}</Text>
      <Text style={styles.stepDesc}>
        Ketuk peta untuk memilih titik, atau lanjutkan pilihan dari halaman Peta.
      </Text>

      {/* Toggle Penjemputan / Tujuan */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, pickingPoint === 'origin' && styles.toggleBtnActive]}
          onPress={() => setPickingPoint('origin')}
          accessibilityRole="button"
          accessibilityLabel="Mode titik penjemputan"
          accessibilityState={{ selected: pickingPoint === 'origin' }}
        >
          <Text
            style={[
              styles.toggleText,
              pickingPoint === 'origin' && styles.toggleTextActive,
            ]}
          >
            📍 Penjemputan
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleBtn,
            pickingPoint === 'destination' && styles.toggleBtnActive,
          ]}
          onPress={() => setPickingPoint('destination')}
          accessibilityRole="button"
          accessibilityLabel="Mode titik tujuan"
          accessibilityState={{ selected: pickingPoint === 'destination' }}
        >
          <Text
            style={[
              styles.toggleText,
              pickingPoint === 'destination' && styles.toggleTextActive,
            ]}
          >
            🏁 Tujuan
          </Text>
        </Pressable>
      </View>

      {/* Peta */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={MALANG_CENTER}
          provider={PROVIDER_GOOGLE}
          onPress={handleMapPress}
          accessibilityLabel="Peta Google Maps"
          accessibilityHint="Ketuk untuk menandai titik penjemputan atau tujuan"
        >
          {pickupCoord && (
            <Marker
              coordinate={pickupCoord}
              title="Penjemputan"
              description="Titik awal pengambilan barang"
              pinColor="#1769AA"
            />
          )}
          {destinationCoord && (
            <Marker
              coordinate={destinationCoord}
              title="Tujuan"
              description="Lokasi tujuan pengiriman"
              pinColor="#E53935"
            />
          )}
        </MapView>

        {/* Akses cepat ke halaman Peta untuk lokasi yang presisi.
            Titik yang sudah ada dikirim agar marker langsung tampil,
            dan hasil pilihan dikembalikan ke form ini (from=booking). */}
        <Pressable
          style={styles.mapHintBtn}
          onPress={() => {
            router.push({
              pathname: '/map',
              params: {
                mode:
                  pickingPoint === 'origin' ? 'pickup' : 'destination',
                from: 'booking',
                ...(pickupCoord
                  ? { pickup: formatCoordinate(pickupCoord) }
                  : null),
                ...(destinationCoord
                  ? { destination: formatCoordinate(destinationCoord) }
                  : null),
              },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Buka halaman peta untuk memilih titik lebih presisi"
        >
          <Text style={styles.mapHintText}>🗺️ Buka Peta Penuh</Text>
        </Pressable>
      </View>

      {/* Info Koordinat (bukan hanya warna — ada teks + label) */}
      <View style={styles.coordCard}>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>📍 Alamat / Koordinat Penjemputan</Text>
          <TextInput
            style={styles.coordInput}
            placeholder="Belum dipilih — ketuk peta"
            placeholderTextColor="#A0AEC0"
            value={pickup}
            onChangeText={setPickup}
            accessibilityLabel="Titik penjemputan"
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.coordLabel}>🏁 Alamat / Koordinat Tujuan</Text>
          <TextInput
            style={styles.coordInput}
            placeholder="Belum dipilih — ketuk peta"
            placeholderTextColor="#A0AEC0"
            value={destination}
            onChangeText={setDestination}
            accessibilityLabel="Titik tujuan"
          />
        </View>
      </View>
    </View>
  );

  // ─── Render: Step Konfirmasi ───────────────────────────────────────────────
  const renderKonfirmasi = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>{STEP_LABELS.konfirmasi}</Text>
      <Text style={styles.stepDesc}>
        Periksa kembali detail pesanan sebelum dikirim ke server.
      </Text>

      {/* Foto dokumentasi dari Kamera (Week 7) */}
      {photo ? (
        <View style={styles.photoCard}>
          <Text style={styles.summaryHeader}>Foto Barang Dilampirkan</Text>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photoPreview}
            accessibilityLabel="Foto barang yang diambil dari kamera"
          />
          <Text style={styles.photoNote}>
            Foto ini akan disebut sebagai dokumentasi pada deskripsi pesanan.
          </Text>
        </View>
      ) : (
        <View style={styles.photoEmpty}>
          <Text style={styles.photoEmptyText}>
            📷 Belum ada foto. Ambil foto barang dari menu Kamera untuk
            melampirkan dokumentasi.
          </Text>
        </View>
      )}

      {/* Kartu Ringkasan */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>Detail Barang</Text>
        <SummaryRow label="Nama Barang" value={itemName} />
        <SummaryRow label="Berat" value={`${weightKg} kg`} />
        <SummaryRow label="Jadwal" value={schedule || '-'} />
        {notes ? <SummaryRow label="Catatan" value={notes} /> : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>Lokasi</Text>
        <SummaryRow label="Penjemputan" value={pickup || '-'} />
        <SummaryRow label="Tujuan" value={destination || '-'} />
        <SummaryRow label="Armada" value={pickedVehicle ? pickedVehicle.name : '-'} />
      </View>

      <View style={[styles.summaryCard, styles.priceCard]}>
        <Text style={styles.summaryHeader}>Estimasi Biaya</Text>
        <Text style={styles.priceValue}>{formatRupiah(hargaEstimasi)}</Text>
        <Text style={styles.priceNote}>
          Harga armada + Rp 5.000/kg. Harga final dikonfirmasi tim MoveMate.
        </Text>
      </View>

      {/* Pengingat login (Week 5 — request tanpa token tidak diterima) */}
      {!user || !token ? (
        <View style={styles.loginReminder}>
          <Text style={styles.loginReminderText}>
            🔐 Kamu belum masuk. Login dulu agar pesanan tersimpan di akunmu.
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Masuk sekarang"
          >
            <Text style={styles.retryText}>Masuk Sekarang</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  // ─── Render utama ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView style={styles.container}>
          {/* Brand & Judul */}
          <View style={styles.header}>
            <Text style={styles.brand}>MoveMate</Text>
            <Text style={styles.title}>Buat Pesanan</Text>
          </View>

          {/* Step Indicator */}
          <StepIndicator current={step} />

          {/* Konten sesuai step */}
          {step === 'detail' && renderDetail()}
          {step === 'lokasi' && renderLokasi()}
          {step === 'konfirmasi' && renderKonfirmasi()}

          {/* Error */}
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              ⚠️ {error}
            </Text>
          ) : null}

          {/* Tombol Navigasi */}
          <View style={styles.navRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={
                step === 'detail' ? 'Batalkan pesanan' : 'Kembali satu langkah'
              }
            >
              <Text style={styles.secondaryBtnText}>
                {step === 'detail' ? 'Batal' : 'Kembali'}
              </Text>
            </Pressable>

            {step !== 'konfirmasi' ? (
              <Pressable
                style={styles.button}
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel="Lanjut ke langkah berikutnya"
              >
                <Text style={styles.buttonText}>Lanjut →</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.button, (loading || !user) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading || !user}
                accessibilityRole="button"
                accessibilityLabel="Kirim pesanan ke server"
                accessibilityHint={`Estimasi biaya ${formatRupiah(hargaEstimasi)}`}
                accessibilityState={{ disabled: loading || !user }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Pesan Sekarang</Text>
                )}
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  brand: {
    color: '#1769AA',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: '#173C67',
    fontSize: 26,
    fontWeight: '800',
  },

  // ── Step Indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDE3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#1769AA',
  },
  stepDotDone: {
    backgroundColor: '#1769AA',
  },
  stepDotText: {
    color: '#596579',
    fontWeight: '700',
    fontSize: 14,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#DDE3EE',
  },
  stepLineDone: {
    backgroundColor: '#1769AA',
  },

  // ── Form / Content
  form: {
    gap: 14,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173C67',
  },
  stepDesc: {
    fontSize: 14,
    color: '#596579',
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#173C67',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A202C',
  },
  textArea: {
    minHeight: 80,
  },

  // ── Armada dari API
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleBtn: {
    flexGrow: 1,
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  vehicleBtnActive: {
    backgroundColor: '#1769AA',
    borderColor: '#1769AA',
  },
  vehicleName: {
    fontWeight: '700',
    color: '#173C67',
    fontSize: 14,
  },
  vehiclePrice: {
    fontSize: 12,
    color: '#596579',
    marginTop: 2,
  },
  vehicleTextActive: {
    color: '#FFFFFF',
  },
  vehicleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  vehicleLoadingText: {
    color: '#596579',
    fontSize: 13,
  },
  vehicleErrorBox: {
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  vehicleErrorText: {
    color: '#B45900',
    fontSize: 13,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1769AA',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Peta
  mapSection: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#1769AA',
    borderColor: '#1769AA',
  },
  toggleText: {
    fontWeight: '600',
    color: '#596579',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  mapHintBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapHintText: {
    color: '#173C67',
    fontWeight: '700',
    fontSize: 12,
  },
  coordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  coordField: {
    gap: 6,
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#596579',
  },
  coordInput: {
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    color: '#1A202C',
    backgroundColor: '#F7F8FA',
  },

  // ── Foto (Week 7)
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#202020',
  },
  photoNote: {
    fontSize: 12,
    color: '#596579',
  },
  photoEmpty: {
    backgroundColor: '#F1F6FC',
    borderRadius: 12,
    padding: 12,
  },
  photoEmptyText: {
    fontSize: 13,
    color: '#596579',
    lineHeight: 19,
  },

  // ── Konfirmasi
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  summaryHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173C67',
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#596579',
    flexShrink: 0,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  priceCard: {
    borderWidth: 1.5,
    borderColor: '#1769AA',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1769AA',
  },
  priceNote: {
    fontSize: 12,
    color: '#596579',
    textAlign: 'center',
  },
  loginReminder: {
    backgroundColor: '#F1F6FC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  loginReminderText: {
    fontSize: 13,
    color: '#173C67',
    lineHeight: 19,
  },

  // ── Error
  error: {
    color: '#C62828',
    fontSize: 14,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },

  // ── Navigasi bawah
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    backgroundColor: '#1769AA',
    padding: 16,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#90B8D8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#596579',
    fontWeight: '600',
    fontSize: 15,
  },
});
