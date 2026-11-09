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

export default function LoginScreen() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Jika user sudah dalam keadaan login
  if (user) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.scroll}>
          <View style={styles.container}>
            <Text style={styles.brand}>MoveMate</Text>
            <Text style={styles.title}>Sudah Masuk</Text>
            <Text style={styles.subtitle}>
              Saat ini kamu sudah masuk sebagai{' '}
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
              accessibilityLabel="Keluar atau ganti akun"
              accessibilityHint="Menghapus sesi di perangkat ini lalu kembali ke halaman login"
            >
              <Text style={styles.logoutSecondaryText}>Keluar / Ganti Akun</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  function validate(): boolean {
    if (!email.trim()) {
      setError('Email tidak boleh kosong.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format email tidak valid.');
      return false;
    }
    if (!password) {
      setError('Password tidak boleh kosong.');
      return false;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return false;
    }
    return true;
  }

  async function handleLogin() {
    setError('');
    setOffline(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success && res.message) {
        setError(res.message);
        setOffline(res.message.includes('Tidak dapat menghubungi server'));
      } else {
        router.replace('/');
      }
    } catch {
      setError('Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Masuk ke Akun</Text>
            <Text style={styles.subtitle}>
              Masukkan email dan password kamu untuk melanjutkan.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
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
                accessibilityLabel="Email"
                accessibilityHint="Email akun yang dipakai saat mendaftar"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Masukkan password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  editable={!loading}
                  accessibilityLabel="Password"
                  accessibilityHint="Kata sandi akun, disembunyikan secara default"
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.showBtn}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                  }
                  accessibilityHint="Menyingkap atau menyembunyikan isi kolom password"
                >
                  <Text style={styles.showBtnText}>
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <Text
                style={[styles.error, offline && styles.offlineNote]}
                accessibilityRole="alert"
                accessibilityLabel={
                  offline
                    ? `Server tidak terjangkau. ${error}`
                    : `Terjadi kesalahan. ${error}`
                }
              >
                {offline ? '📡 ' : '⚠️ '}
                {error}
              </Text>
            ) : null}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke akun MoveMate"
              accessibilityHint="Memeriksa email dan password ke server lalu masuk ke aplikasi"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Masuk</Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <Pressable
              onPress={() => router.push('/register')}
              accessibilityRole="button"
              accessibilityLabel="Daftar sekarang"
              accessibilityHint="Membuka halaman pendaftaran akun baru"
            >
              <Text style={styles.footerLink}>Daftar sekarang</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.secondary}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.secondaryText}>Kembali</Text>
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
  container: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
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
  boldText: {
    fontWeight: '700',
    color: '#173C67',
  },
  form: {
    gap: 16,
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
});
