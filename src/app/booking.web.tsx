import { useState, useEffect } from 'react';import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { showMessage } from '@/constants/alert';
import { useAuth } from '@/constants/auth-context';
import { ApiError } from '@/constants/api';
import { getVehicles, createOrder } from '@/constants/order-service';
import {
  type VehicleInfo,
  type OrderInfo,
  formatRupiah,
} from '@/constants/dto';
import { type AttachedPhoto, consumePhotoForOrder } from '@/constants/photo-store';

type Step = 'detail' | 'lokasi' | 'konfirmasi';

const STEP_LABELS: Record<Step, string> = {
  detail: '1. Detail Barang',
  lokasi: '2. Isi Lokasi',
  konfirmasi: '3. Konfirmasi',
};

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

// ─── Web: Booking dengan alamat teks (tanpa MapView) ────────────────────────

export default function BookingWebScreen() {
  const { token, user } = useAuth();
  const [step, setStep] = useState<Step>('detail');
  const [itemName, setItemName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes] = useState('');

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

  const berat = parseFloat(weightKg.replace(',', '.'));
  const pickedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const hargaEstimasi =
    pickedVehicle && Number.isFinite(berat) && berat > 0
      ? pickedVehicle.price + berat * 5000
      : 0;

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
      setError('Alamat penjemputan tidak boleh kosong.');
      return false;
    }
    if (!destination.trim()) {
      setError('Alamat tujuan tidak boleh kosong.');
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

  // POST /api/orders dengan Bearer Token (Week 5)
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
      setPickup('');
      setDestination('');
      setSchedule('');
      setNotes('');
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

  // ── Render Detail ──────────────────────────────────────────────────────────
  function renderDetail() {
    return (
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
            onChangeText={(v) => {
              setItemName(v);
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
            onChangeText={(v) => {
              setWeightKg(v);
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
            onChangeText={(v) => {
              setSchedule(v);
              if (error) setError('');
            }}
            accessibilityLabel="Jadwal pindahan, wajib diisi"
            accessibilityHint="Format tahun-bulan-tanggal jam:menit"
          />
        </View>

        {/* Armada dari API (Week 4) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Armada *</Text>
          {vehicleLoading ? (
            <View style={styles.vehicleLoading}>
              <ActivityIndicator color="#1769AA" />
              <Text style={styles.vehicleLoadingText}>Memuat armada dari server…</Text>
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
                  style={[
                    styles.vehicleBtn,
                    vehicleId === v.id && styles.vehicleBtnActive,
                  ]}
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
  }

  // ── Render Lokasi (teks, bukan peta — web) ─────────────────────────────────
  function renderLokasi() {
    return (
      <View style={styles.form}>
        <Text style={styles.stepTitle}>{STEP_LABELS.lokasi}</Text>
        <Text style={styles.stepDesc}>
          Masukkan alamat lengkap penjemputan dan tujuan pengiriman.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Fitur peta interaktif tersedia di aplikasi Android/iOS melalui
            Expo Go.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>📍 Alamat Penjemputan *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contoh: Jl. Soekarno Hatta No. 12, Malang"
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            value={pickup}
            onChangeText={(v) => {
              setPickup(v);
              if (error) setError('');
            }}
            accessibilityLabel="Alamat penjemputan, wajib diisi"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>🏁 Alamat Tujuan *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contoh: Jl. Veteran No. 55, Malang"
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            value={destination}
            onChangeText={(v) => {
              setDestination(v);
              if (error) setError('');
            }}
            accessibilityLabel="Alamat tujuan, wajib diisi"
          />
        </View>
      </View>
    );
  }

  // ── Render Konfirmasi ──────────────────────────────────────────────────────
  function renderKonfirmasi() {
    return (
      <View style={styles.form}>
        <Text style={styles.stepTitle}>{STEP_LABELS.konfirmasi}</Text>
        <Text style={styles.stepDesc}>
          Periksa kembali detail pesanan sebelum dikirim ke server.
        </Text>

        {photo ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📷 Foto barang dari kamera dilampirkan ke pesanan ini.
            </Text>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>Detail Barang</Text>
          <SummaryRow label="Nama Barang" value={itemName} />
          <SummaryRow label="Berat" value={`${weightKg} kg`} />
          <SummaryRow label="Jadwal" value={schedule || '-'} />
          <SummaryRow
            label="Armada"
            value={pickedVehicle ? pickedVehicle.name : '-'}
          />
          {notes ? <SummaryRow label="Catatan" value={notes} /> : null}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>Lokasi</Text>
          <SummaryRow label="Penjemputan" value={pickup || '-'} />
          <SummaryRow label="Tujuan" value={destination || '-'} />
        </View>

        <View style={[styles.summaryCard, styles.priceCard]}>
          <Text style={styles.summaryHeader}>Estimasi Biaya</Text>
          <Text style={styles.priceValue}>{formatRupiah(hargaEstimasi)}</Text>
          <Text style={styles.priceNote}>
            Harga armada + Rp 5.000/kg. Harga final dikonfirmasi tim MoveMate.
          </Text>
        </View>

        {/* Pengingat login (Week 5) */}
        {!user || !token ? (
          <View style={styles.loginReminder}>
            <Text style={styles.loginReminderText}>
              🔐 Kamu belum masuk. Login dulu agar pesanan tersimpan di akunmu —
              server menolak request tanpa token (401).
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
  }

  // ── Render Utama ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brand}>MoveMate</Text>
            <Text style={styles.title}>Buat Pesanan</Text>
          </View>

          <StepIndicator current={step} />

          {step === 'detail' && renderDetail()}
          {step === 'lokasi' && renderLokasi()}
          {step === 'konfirmasi' && renderKonfirmasi()}

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              ⚠️ {error}
            </Text>
          ) : null}

          <View style={styles.navRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={step === 'detail' ? 'Batalkan pesanan' : 'Kembali satu langkah'}
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
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: '#F7F8FA', padding: 20, gap: 16 },
  header: { gap: 4 },
  brand: { color: '#1769AA', fontSize: 16, fontWeight: '700' },
  title: { color: '#173C67', fontSize: 26, fontWeight: '800' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DDE3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#1769AA' },
  stepDotDone: { backgroundColor: '#1769AA' },
  stepDotText: { color: '#596579', fontWeight: '700', fontSize: 14 },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#DDE3EE' },
  stepLineDone: { backgroundColor: '#1769AA' },
  form: { gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#173C67' },
  stepDesc: { fontSize: 14, color: '#596579', lineHeight: 20 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#173C67' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A202C',
  },
  textArea: { minHeight: 72 },
  infoBox: {
    backgroundColor: '#EEF4FB',
    borderRadius: 10,
    padding: 12,
  },
  infoText: { color: '#1769AA', fontSize: 13, lineHeight: 20 },

  // ── Armada
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
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleBtnActive: {
    backgroundColor: '#1769AA',
    borderColor: '#1769AA',
  },
  vehicleName: { fontWeight: '700', color: '#173C67', fontSize: 14 },
  vehiclePrice: { fontSize: 12, color: '#596579', marginTop: 2 },
  vehicleTextActive: { color: '#FFFFFF' },
  vehicleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  vehicleLoadingText: { color: '#596579', fontSize: 13 },
  vehicleErrorBox: {
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  vehicleErrorText: { color: '#B45900', fontSize: 13 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1769AA',
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  loginReminder: {
    backgroundColor: '#F1F6FC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  loginReminderText: {
    fontSize: 13,
    color: '#173C67',
    lineHeight: 20,
  },

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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  summaryLabel: { fontSize: 14, color: '#596579', flexShrink: 0 },
  summaryValue: {
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  priceCard: { borderWidth: 1.5, borderColor: '#1769AA', alignItems: 'center', gap: 4 },
  priceValue: { fontSize: 24, fontWeight: '800', color: '#1769AA' },
  priceNote: { fontSize: 12, color: '#596579', textAlign: 'center' },
  error: {
    color: '#C62828',
    fontSize: 14,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  button: {
    flex: 1,
    backgroundColor: '#1769AA',
    padding: 16,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#90B8D8' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#596579', fontWeight: '600', fontSize: 15 },
});
