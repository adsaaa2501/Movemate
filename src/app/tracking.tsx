import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';

type TrackingStep = {
  title: string;
  desc: string;
  time: string;
  completed: boolean;
  current: boolean;
};

type TrackingData = {
  orderId: string;
  status: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  pickup: string;
  destination: string;
  eta: string;
  timeline: TrackingStep[];
};

const SAMPLE_TRACKING: TrackingData = {
  orderId: 'MM-20241101-001',
  status: 'Dalam Perjalanan ke Tujuan',
  driverName: 'Pak Joko Santoso',
  driverPhone: '0812-3456-7890',
  vehiclePlate: 'N 8923 AA',
  vehicleType: 'Pickup Box (L300)',
  pickup: 'Jl. Soekarno Hatta No. 12, Lowokwaru, Malang',
  destination: 'Jl. Veteran No. 55, Klojen, Malang',
  eta: '25 Menit lagi (± 15:45 WIB)',
  timeline: [
    {
      title: 'Pesanan Dikonfirmasi',
      desc: 'Pesanan telah diverifikasi oleh tim MoveMate.',
      time: '14:00 WIB',
      completed: true,
      current: false,
    },
    {
      title: 'Driver Ditugaskan',
      desc: 'Pak Joko Santoso ditugaskan untuk pengantaran ini.',
      time: '14:15 WIB',
      completed: true,
      current: false,
    },
    {
      title: 'Barang Dijemput & Dimuat',
      desc: 'Semua barang telah dipacking dan dimuat ke pickup.',
      time: '14:40 WIB',
      completed: true,
      current: false,
    },
    {
      title: 'Dalam Perjalanan',
      desc: 'Armada sedang melaju menuju lokasi tujuan.',
      time: '15:10 WIB',
      completed: true,
      current: true,
    },
    {
      title: 'Tiba di Tujuan',
      desc: 'Pembongkaran barang dan serah terima dokumen.',
      time: 'Estimasi 15:45 WIB',
      completed: false,
      current: false,
    },
  ],
};

export default function TrackingScreen() {
  const [searchId, setSearchId] = useState('MM-20241101-001');
  const [trackingInfo, setTrackingInfo] = useState<TrackingData | null>(SAMPLE_TRACKING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSearch() {
    if (!searchId.trim()) {
      setError('Masukkan ID Pesanan terlebih dahulu.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Untuk simulasi, ID yang cocok atau baru
      setTrackingInfo({
        ...SAMPLE_TRACKING,
        orderId: searchId.trim().toUpperCase(),
      });
    }, 700);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.brand}>MoveMate Live Tracking</Text>
          <Text style={styles.title}>Pelacakan Armada</Text>
          <Text style={styles.subtitle}>
            Pantau pergerakan pengiriman barang pindahanmu secara real-time.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>Nomor ID Pesanan</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Contoh: MM-20241101-001"
              placeholderTextColor="#A0AEC0"
              autoCapitalize="characters"
              value={searchId}
              onChangeText={(text) => {
                setSearchId(text);
                if (error) setError('');
              }}
            />
            <Pressable
              style={[styles.searchBtn, loading && styles.btnDisabled]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchBtnText}>Lacak</Text>
              )}
            </Pressable>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Tracking Details */}
        {trackingInfo ? (
          <View style={styles.resultContainer}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusDot}>🟢</Text>
                <Text style={styles.statusBadgeText}>STATUS LIVE</Text>
              </View>
              <Text style={styles.statusTitle}>{trackingInfo.status}</Text>
              <Text style={styles.etaText}>⏱️ Estimasi Tiba: {trackingInfo.eta}</Text>
              <Text style={styles.orderIdBadge}>ID: {trackingInfo.orderId}</Text>
            </View>

            {/* Driver Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>👤 Informasi Driver & Armada</Text>
              <View style={styles.driverRow}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarText}>🚚</Text>
                </View>
                <View style={styles.driverMeta}>
                  <Text style={styles.driverName}>{trackingInfo.driverName}</Text>
                  <Text style={styles.driverPhone}>📞 {trackingInfo.driverPhone}</Text>
                  <Text style={styles.driverVehicle}>
                    {trackingInfo.vehicleType} • {trackingInfo.vehiclePlate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Route Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>📍 Rute Pengiriman</Text>
              <View style={styles.routeItem}>
                <Text style={styles.routeDotOrigin}>🔵</Text>
                <View style={styles.routeTextCol}>
                  <Text style={styles.routeLabel}>Lokasi Penjemputan</Text>
                  <Text style={styles.routeAddress}>{trackingInfo.pickup}</Text>
                </View>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <Text style={styles.routeDotDest}>🏁</Text>
                <View style={styles.routeTextCol}>
                  <Text style={styles.routeLabel}>Lokasi Tujuan</Text>
                  <Text style={styles.routeAddress}>{trackingInfo.destination}</Text>
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>🕒 Riwayat Perjalanan</Text>
              <View style={styles.timelineList}>
                {trackingInfo.timeline.map((step, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineIndicator}>
                      <View
                        style={[
                          styles.timelineCircle,
                          step.completed && styles.timelineCircleCompleted,
                          step.current && styles.timelineCircleCurrent,
                        ]}
                      >
                        <Text style={styles.circleCheck}>
                          {step.completed ? '✓' : '•'}
                        </Text>
                      </View>
                      {idx < trackingInfo.timeline.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            step.completed && styles.timelineLineCompleted,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHead}>
                        <Text
                          style={[
                            styles.timelineStepTitle,
                            step.current && styles.timelineStepTitleCurrent,
                          ]}
                        >
                          {step.title}
                        </Text>
                        <Text style={styles.timelineTime}>{step.time}</Text>
                      </View>
                      <Text style={styles.timelineDesc}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {/* Quick Back */}
        <Pressable style={styles.backBtn} onPress={() => router.push('/order')}>
          <Text style={styles.backBtnText}>← Lihat Semua Riwayat Pesanan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  brand: {
    color: '#1769AA',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#173C67',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#596579',
    fontSize: 14,
    lineHeight: 20,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173C67',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A202C',
    fontWeight: '600',
  },
  searchBtn: {
    backgroundColor: '#1769AA',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#90B8D8',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
  },
  resultContainer: {
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#173C67',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusDot: {
    fontSize: 10,
  },
  statusBadgeText: {
    color: '#A5D6A7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  etaText: {
    color: '#BBDEFB',
    fontSize: 14,
    fontWeight: '600',
  },
  orderIdBadge: {
    color: '#90CAF9',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173C67',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF4FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: 22,
  },
  driverMeta: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  driverPhone: {
    fontSize: 13,
    color: '#1769AA',
    fontWeight: '600',
  },
  driverVehicle: {
    fontSize: 12,
    color: '#596579',
  },
  routeItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  routeDotOrigin: {
    fontSize: 14,
    marginTop: 2,
  },
  routeDotDest: {
    fontSize: 14,
    marginTop: 2,
  },
  routeTextCol: {
    flex: 1,
    gap: 2,
  },
  routeLabel: {
    fontSize: 12,
    color: '#596579',
    fontWeight: '600',
  },
  routeAddress: {
    fontSize: 13,
    color: '#1A202C',
    fontWeight: '500',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#F0F4FA',
    marginVertical: 4,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
  },
  timelineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDE3EE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineCircleCompleted: {
    backgroundColor: '#2E7D32',
  },
  timelineCircleCurrent: {
    backgroundColor: '#1769AA',
    borderWidth: 3,
    borderColor: '#BBDEFB',
  },
  circleCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 36,
    backgroundColor: '#DDE3EE',
    marginVertical: 2,
  },
  timelineLineCompleted: {
    backgroundColor: '#2E7D32',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
    gap: 4,
  },
  timelineHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#596579',
  },
  timelineStepTitleCurrent: {
    color: '#1769AA',
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  timelineDesc: {
    fontSize: 12.5,
    color: '#718096',
    lineHeight: 18,
  },
  backBtn: {
    alignItems: 'center',
    padding: 12,
  },
  backBtnText: {
    color: '#1769AA',
    fontSize: 14,
    fontWeight: '600',
  },
});

