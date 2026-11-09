import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/constants/auth-context';

export default function RegisterScreen() {
  const { user, registerUser, logout } = useAuth();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [sukses, setSukses] = useState(false);

  // Jika user sudah masuk
  if (user && !sukses) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.suksesWrapper}>
          <View style={styles.container}>
            <Text style={styles.brand}>MoveMate</Text>
            <Text style={styles.title}>Sudah Masuk</Text>
            <Text style={styles.subtitle}>
              Saat ini kamu sudah terdaftar dan masuk sebagai{' '}
              <Text style={styles.boldText}>{user.name}</Text> ({user.email}).
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Lanjut ke beranda"
              accessibilityHint="Membuka halaman utama MoveMate"
            >
              <Text style={styles.buttonText}>Lanjut ke Beranda</Text>
            </Pressable>

            <Pressable
              style={styles.logoutSecondaryBtn}
              onPress={async () => {
                await logout();
              }}
              accessibilityRole="button"
              accessibilityLabel="Keluar atau daftarkan akun lain"
              accessibilityHint="Menghapus sesi di perangkat ini lalu kembali ke halaman daftar"
            >
              <Text style={styles.logoutSecondaryText}>Keluar / Daftarkan Akun Lain</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  function validate(): boolean {
    if (!nama.trim()) {
      setError('Nama lengkap tidak boleh kosong.');
      return false;
    }
    if (nama.trim().length < 2) {
      setError('Nama terlalu pendek.');
      return false;
    }
    if (!email.trim()) {
      setError('Email tidak boleh kosong.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format email tidak valid.');
      return false;
    }
    if (!noHp.trim()) {
      setError('Nomor HP tidak boleh kosong.');
      return false;
    }
    const cleanedHp = noHp.replace(/[\s-]/g, '');
    if (cleanedHp.length < 9 || cleanedHp.length > 15) {
      setError('Nomor HP minimal 9-14 digit.');
      return false;
    }
    if (!password) {
      setError('Password tidak boleh kosong.');
      return false;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return false;
    }
    if (!konfirmasiPassword) {
      setError('Konfirmasi password tidak boleh kosong.');
      return false;
    }
    if (password !== konfirmasiPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return false;
    }
    return true;
  }

  async function handleRegister() {
    setError('');
    setOffline(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await registerUser(nama, email, password);
      if (!res.success && res.message) {
        setError(res.message);
        setOffline(res.message.includes('Tidak dapat menghubungi server'));
      } else {
        setSukses(true);
      }
    } catch {
      setSukses(true);
    } finally {
      setLoading(false);
    }
  }

  if (sukses) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.suksesWrapper}>
          <View style={styles.container}>
            <Text style={styles.suksesIcon} accessibilityLabel="Pendaftaran berhasil">
              🎉
            </Text>
            <Text style={styles.suksesTitle}>Pendaftaran Berhasil!</Text>
            <Text style={styles.suksesDesc}>
              Selamat datang, <Text style={styles.boldText}>{nama.trim()}</Text>!{'\n'}
              Akun kamu telah berhasil dibuat dan kamu telah otomatis masuk.
            </Text>
            <Pressable
              style={styles.button}
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke aplikasi"
            >
              <Text style={styles.buttonText}>Langsung Masuk ke Aplikasi</Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() => router.replace('/')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>Ke Beranda</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>MoveMate</Text>
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>
              Daftarkan diri kamu untuk menikmati layanan pindahan MoveMate.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Nama */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="words"
                value={nama}
                onChangeText={(text) => {
                  setNama(text);
                  if (error) setError('');
                }}
                editable={!loading}
                accessibilityLabel="Nama lengkap, wajib diisi"
              />
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="contoh@email.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                editable={!loading}
                accessibilityLabel="Email, wajib diisi"
                accessibilityHint="Email akan dipakai untuk masuk aplikasi"
              />
            </View>

            {/* No HP */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nomor HP *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 081234567890"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={noHp}
                onChangeText={(text) => {
                  setNoHp(text);
                  if (error) setError('');
                }}
                editable={!loading}
                accessibilityLabel="Nomor HP, wajib diisi"
                accessibilityHint="Nomor telepon antara 9 sampai 14 digit"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Min. 8 karakter"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  editable={!loading}
                  accessibilityLabel="Password, wajib diisi minimal 8 karakter"
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.showBtn}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                  }
                >
                  <Text style={styles.showBtnText}>
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Konfirmasi Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Konfirmasi Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ulangi password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showKonfirmasi}
                  value={konfirmasiPassword}
                  onChangeText={(text) => {
                    setKonfirmasiPassword(text);
                    if (error) setError('');
                  }}
                  editable={!loading}
                  accessibilityLabel="Konfirmasi password, wajib sama dengan password"
                />
                <Pressable
                  onPress={() => setShowKonfirmasi((prev) => !prev)}
                  style={styles.showBtn}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showKonfirmasi
                      ? 'Sembunyikan konfirmasi password'
                      : 'Tampilkan konfirmasi password'
                  }
                >
                  <Text style={styles.showBtnText}>
                    {showKonfirmasi ? 'Sembunyikan' : 'Tampilkan'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <Text
                style={[styles.error, offline && styles.offlineNote]}
                accessibilityRole="alert"
              >
                {offline ? '📡 ' : '⚠️ '}
                {error}
              </Text>
            ) : null}

            {/* Tombol Daftar */}
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Daftar sekarang"
              accessibilityHint="Mengirim data pendaftaran ke server lalu otomatis masuk"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Daftar Sekarang</Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <Pressable
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              accessibilityLabel="Masuk di sini"
              accessibilityHint="Membuka halaman login untuk akun yang sudah terdaftar"
            >
              <Text style={styles.footerLink}>Masuk di sini</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.secondary}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke beranda"
          >
            <Text style={styles.secondaryText}>Kembali ke Beranda</Text>
          </Pressable>
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
    justifyContent: 'center',
    padding: 24,
  },
  suksesWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  header: {
    gap: 6,
  },
  brand: {
    color: '#1769AA',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: '#173C67',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: '#596579',
    lineHeight: 20,
  },
  form: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173C67',
  },
  input: {
    backgroundColor: '#F7F8FA',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A202C',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    borderRadius: 10,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#1A202C',
  },
  showBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  showBtnText: {
    color: '#1769AA',
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  offlineNote: {
    color: '#B45900',
    backgroundColor: '#FFF7E6',
  },
  button: {
    backgroundColor: '#1769AA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    backgroundColor: '#90B8D8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutSecondaryBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  logoutSecondaryText: {
    color: '#C62828',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#596579',
    fontSize: 14,
  },
  footerLink: {
    color: '#1769AA',
    fontWeight: '700',
    fontSize: 14,
  },
  secondary: {
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#596579',
    fontSize: 13,
  },
  suksesIcon: {
    fontSize: 54,
    textAlign: 'center',
  },
  suksesTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#173C67',
    textAlign: 'center',
  },
  suksesDesc: {
    fontSize: 14,
    color: '#596579',
    lineHeight: 22,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '700',
    color: '#173C67',
  },
});
