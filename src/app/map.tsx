import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
} from 'react-native';
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';

type Coordinate = { latitude: number; longitude: number };

const MALANG_CENTER: Region = {
  latitude: -7.9666,
  longitude: 112.6326,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export default function MapScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();

  const [pickingPoint, setPickingPoint] = useState<'pickup' | 'destination'>(() =>
    params.mode === 'destination' ? 'destination' : 'pickup'
  );
  const [pickup, setPickup] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(MALANG_CENTER);

  const [locLoading, setLocLoading] = useState(true);
  const [locPermission, setLocPermission] = useState<'unknown' | 'granted' | 'denied'>(
    'unknown'
  );
  const [error, setError] = useState('');

  // Lokasi pengguna dipakai sebagai pusat peta (Week 7 — izin lokasi + koordinat).
  // Semua setState ada di dalam callback promise (bukan sinkron di body effect).
  useEffect(() => {
    let cancelled = false;

    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (cancelled) return null;
        if (status !== 'granted') {
          // Tetap tampilkan peta Malang walau izin ditolak.
          setLocPermission('denied');
          return null;
        }
        setLocPermission('granted');
        return Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      })
      .then((position) => {
        if (cancelled || !position) return;
        setMapRegion({
          ...MALANG_CENTER,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLocPermission('denied');
      })
      .finally(() => {
        if (!cancelled) setLocLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function grabCurrentLocation() {
    setError('');
    setLocLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') {
          setLocPermission('denied');
          setError('Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan HP.');
          return;
        }
      }
      setLocPermission('granted');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      if (pickingPoint === 'pickup') setPickup(coords);
      else setDestination(coords);
      setMapRegion({ ...MALANG_CENTER, ...coords });
    } catch {
      setError('Gagal mengambil posisi saat ini. Coba lagi.');
    } finally {
      setLocLoading(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    const coord = event.nativeEvent.coordinate;
    if (pickingPoint === 'pickup') setPickup(coord);
    else setDestination(coord);
    setError('');
  }

  function formatCoord(coord: Coordinate | null): string {
    return coord ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}` : '';
  }

  function sendToBooking() {
    if (!pickup || !destination) {
      setError('Pilih titik penjemputan dan tujuan terlebih dahulu.');
      return;
    }
    // Koordinat dipilih dikirim ke proses booking (Week 7)
    router.push({
      pathname: '/booking',
      params: {
        pickup: formatCoord(pickup),
        destination: formatCoord(destination),
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Peta MoveMate</Text>
      <Text style={styles.description}>
        Pilih titik penjemputan dan tujuan, lalu gunakan sebagai alamat pesanan.
      </Text>

      {/* Toggle titik yang sedang dipilih */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, pickingPoint === 'pickup' && styles.toggleBtnActive]}
          onPress={() => setPickingPoint('pickup')}
          accessibilityRole="button"
          accessibilityLabel="Pilih mode titik penjemputan"
          accessibilityState={{ selected: pickingPoint === 'pickup' }}
        >
          <Text
            style={[
              styles.toggleText,
              pickingPoint === 'pickup' && styles.toggleTextActive,
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
          accessibilityLabel="Pilih mode titik tujuan"
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
          style={StyleSheet.absoluteFill}
          region={mapRegion}
          onPress={handleMapPress}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={locPermission === 'granted'}
          showsMyLocationButton={false}
          accessibilityLabel="Peta Google Maps"
          accessibilityHint="Ketuk peta untuk menandai titik yang sedang dipilih"
        >
          {pickup && (
            <Marker
              coordinate={pickup}
              title="Penjemputan"
              description="Titik awal pengambilan barang"
              pinColor="#1769AA"
            />
          )}
          {destination && (
            <Marker
              coordinate={destination}
              title="Tujuan"
              description="Lokasi tujuan pengiriman"
              pinColor="#E53935"
            />
          )}
        </MapView>

        {locLoading ? (
          <View style={styles.locStatus}>
            <ActivityIndicator color="#1769AA" size="small" />
          </View>
        ) : null}
      </View>

      {/* Koordinat + aksi lokasi */}
      <View style={styles.coordinates}>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>📍 Penjemputan:</Text>
          <Text style={styles.coordValue}>
            {pickup ? formatCoord(pickup) : 'Belum dipilih'}
          </Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>🏁 Tujuan:</Text>
          <Text style={styles.coordValue}>
            {destination
              ? formatCoord(destination)
              : 'Belum dipilih'}
          </Text>
        </View>
        <Text style={styles.tripNote}>
          {locPermission === 'denied'
            ? 'ℹ️ Izin lokasi ditolak — titik dipilih manual lewat ketukan peta.'
            : 'Ketuk peta untuk menandai titik yang sedang dipilih.'}
        </Text>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          ⚠️ {error}
        </Text>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.locBtn}
          onPress={() => void grabCurrentLocation()}
          accessibilityRole="button"
          accessibilityLabel="Gunakan lokasi saya saat ini"
          accessibilityHint="Mengambil koordinat perangkat untuk titik yang sedang dipilih"
        >
          <Text style={styles.locBtnText}>📡 Lokasi Saya</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={sendToBooking}
          accessibilityRole="button"
          accessibilityLabel="Gunakan titik ini untuk pesanan"
          accessibilityHint="Membuka halaman pesanan dengan kedua titik sudah terisi"
        >
          <Text style={styles.buttonText}>Gunakan untuk Pesanan →</Text>
        </Pressable>
      </View>

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
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#173C67',
  },
  description: {
    fontSize: 14,
    color: '#596579',
    lineHeight: 21,
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
    flex: 1,
    minHeight: 320,
    overflow: 'hidden',
    borderRadius: 16,
  },
  locStatus: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
  },
  coordinates: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 8,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  coordLabel: {
    fontWeight: '700',
    fontSize: 13,
    color: '#173C67',
  },
  coordValue: {
    fontSize: 13,
    color: '#1769AA',
    flex: 1,
    textAlign: 'right',
  },
  tripNote: {
    fontSize: 12,
    color: '#596579',
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  locBtn: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1769AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locBtnText: {
    color: '#1769AA',
    fontWeight: '700',
    fontSize: 14,
  },
  button: {
    flex: 1,
    backgroundColor: '#1769AA',
    padding: 15,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondary: {
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
});
