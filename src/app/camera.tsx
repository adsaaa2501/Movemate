import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { savePhotoForOrder } from '@/constants/photo-store';
import { showMessage } from '@/constants/alert';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef<CameraView>(null);

  async function takePhoto() {
    if (!cameraReady || !cameraRef.current) {
      setError('Kamera belum siap. Coba lagi.');
      return;
    }

    setBusy(true);
    try {
      setError('');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    } catch {
      setError('Foto gagal diambil. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  // Simpan foto lalu buka halaman pesanan agar foto terhubung ke booking (Week 7)
  function attachToOrder() {
    if (!photoUri) return;
    savePhotoForOrder(photoUri);
    showMessage(
      'Foto Terhubung ke Pesanan 📦',
      'Foto dokumentasi ini akan tampil pada langkah konfirmasi di halaman Pesan.',
      () => router.push('/booking')
    );
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} accessibilityLabel="Memuat kamera">
        <ActivityIndicator color="#1769AA" />
        <Text style={styles.description}>Memeriksa izin kamera…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const blocked = permission.canAskAgain === false;
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Kamera MoveMate</Text>
        <Text style={styles.description}>
          📷 Kamera digunakan untuk mengambil foto kondisi barang sebelum dan
          sesudah dipindahkan.{"\n"}
          {blocked
            ? 'Izin telah ditolak permanen. Aktifkan kewenangan kamera melalui pengaturan aplikasi.'
            : 'Kami butuh izin kamera; foto disimpan di perangkatmu saja.'}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => void requestPermission()}
          accessibilityRole="button"
          accessibilityLabel="Izinkan kamera"
          accessibilityHint="Menampilkan dialog izin kamera sistem"
        >
          <Text style={styles.buttonText}>
            {blocked ? 'Minta Izin Sekali Lagi' : 'Izinkan Kamera'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.secondary}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Text>Kembali</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Foto Barang</Text>
      <Text style={styles.description}>
        Ambil foto barang sebagai dokumentasi kondisi sebelum pindahan.
      </Text>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          accessibilityLabel="Pratinjau foto barang yang baru diambil"
          accessible
          accessibilityRole="image"
        />
      ) : (
        <View style={styles.cameraBox}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
          {!cameraReady ? (
            <View style={styles.cameraLoading}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      )}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          ⚠️ {error}
        </Text>
      ) : null}

      {photoUri ? (
        <>
          {/* Hubungkan foto dengan proses pemesanan */}
          <Pressable
            style={styles.button}
            onPress={attachToOrder}
            accessibilityRole="button"
            accessibilityLabel="Lampirkan foto ini ke pesanan"
            accessibilityHint="Membuka halaman pesanan dengan foto tersambung"
          >
            <Text style={styles.buttonText}>📎 Lampirkan ke Pesanan</Text>
          </Pressable>
          <Pressable
            style={styles.retakeBtn}
            onPress={() => {
              setPhotoUri(null);
              setCameraReady(false);
              setError('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Ambil ulang foto"
          >
            <Text style={styles.retakeText}>🔄 Ambil Ulang Foto</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={() => void takePhoto()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Ambil foto barang"
          accessibilityState={{ disabled: busy }}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>📷 Ambil Foto</Text>
          )}
        </Pressable>
      )}

      <Pressable
        style={styles.secondary}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Kembali ke beranda"
      >
        <Text>Kembali ke Beranda</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#173C67',
  },
  description: {
    fontSize: 15,
    color: '#596579',
    lineHeight: 22,
  },
  cameraBox: {
    height: 410,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#202020',
  },
  cameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: 410,
    resizeMode: 'contain',
    backgroundColor: '#202020',
    borderRadius: 18,
  },
  button: {
    backgroundColor: '#1769AA',
    padding: 15,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  retakeBtn: {
    padding: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
  },
  retakeText: {
    color: '#173C67',
    fontSize: 15,
    fontWeight: '700',
  },
  secondary: {
    padding: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#C62828',
  },
});
