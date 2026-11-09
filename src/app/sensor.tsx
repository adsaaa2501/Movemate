
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { router } from 'expo-router';

type SensorData = {
  x: number;
  y: number;
  z: number;
};

export default function SensorScreen() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [running, setRunning] = useState(true);
  const [sensorData, setSensorData] = useState<SensorData>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null =
      null;

    async function startSensor() {
      try {
        const supported = await Accelerometer.isAvailableAsync();

        if (cancelled) return;

        setAvailable(supported);

        if (!supported) {
          setError('Accelerometer tidak tersedia di perangkat ini.');
          return;
        }

        Accelerometer.setUpdateInterval(300);

        if (running) {
          subscription = Accelerometer.addListener((data) => {
            setSensorData(data);
          });
        }
      } catch {
        if (!cancelled) {
          setError('Gagal membaca data sensor.');
          setAvailable(false);
        }
      }
    }

    void startSensor();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [running]);

  const magnitude = Math.sqrt(
    sensorData.x * sensorData.x +
    sensorData.y * sensorData.y +
    sensorData.z * sensorData.z
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sensor Perangkat</Text>
      <Text style={styles.description}>
        Accelerometer membaca percepatan pada tiga sumbu perangkat.
        Gerakkan atau miringkan HP untuk melihat perubahan nilai.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Status sensor</Text>
        <Text>
          {available === null
            ? 'Memeriksa sensor...'
            : available
              ? running
                ? 'Aktif'
                : 'Dihentikan'
              : 'Tidak tersedia'}
        </Text>

        <Text style={styles.label}>Sumbu X</Text>
        <Text style={styles.value}>{sensorData.x.toFixed(3)}</Text>

        <Text style={styles.label}>Sumbu Y</Text>
        <Text style={styles.value}>{sensorData.y.toFixed(3)}</Text>

        <Text style={styles.label}>Sumbu Z</Text>
        <Text style={styles.value}>{sensorData.z.toFixed(3)}</Text>

        <Text style={styles.label}>Besaran vektor</Text>
        <Text style={styles.value}>{magnitude.toFixed(3)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={() => setRunning((current) => !current)}
      >
        <Text style={styles.buttonText}>
          {running ? 'Hentikan Sensor' : 'Mulai Sensor'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={() => router.back()}
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
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#173C67',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#596579',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  label: {
    color: '#596579',
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1769AA',
    marginBottom: 7,
  },
  button: {
    backgroundColor: '#1769AA',
    padding: 15,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    padding: 12,
    alignItems: 'center',
  },
  error: {
    color: '#C62828',
  },
});
