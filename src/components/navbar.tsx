import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/constants/auth-context';

type NavItem = {
  label: string;
  href: '/' | '/booking' | '/order' | '/tracking' | '/map' | '/camera' | '/sensor' | '/login' | '/register';
  icon: string;
};

const MAIN_NAV: NavItem[] = [
  { label: 'Beranda', href: '/', icon: '🏠' },
  { label: 'Pesan', href: '/booking', icon: '📦' },
  { label: 'Pesanan', href: '/order', icon: '📋' },
  { label: 'Lacak', href: '/tracking', icon: '📍' },
  { label: 'Peta', href: '/map', icon: '🗺️' },
  { label: 'Kamera', href: '/camera', icon: '📷' },
  { label: 'Sensor', href: '/sensor', icon: '📡' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function navigateTo(path: NavItem['href']) {
    if (pathname === path) return;
    router.push(path);
  }

  const isLoginActive = pathname === '/login';
  const isRegisterActive = pathname === '/register';

  return (
    <View style={styles.header}>
      {/* Top Bar: Brand Logo & User Profile / Auth Buttons */}
      <View style={styles.topRow}>
        <Pressable
          style={styles.brand}
          onPress={() => navigateTo('/')}
          accessibilityRole="button"
          accessibilityLabel="MoveMate — kembali ke beranda"
          accessibilityHint="Membuka halaman utama aplikasi"
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon} accessible={false}>
              🚚
            </Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>MoveMate</Text>
            <Text style={styles.brandTagline}>Pindahan Mudah &amp; Aman</Text>
          </View>
        </Pressable>

        {/* User Profile jika sudah login, atau Tombol Masuk/Daftar jika belum */}
        {user ? (
          <View style={styles.authRow}>
            <View
              style={styles.userBadge}
              accessible
              accessibilityLabel={`Masuk sebagai ${user.name}`}
            >
              <Text style={styles.userAvatarIcon} accessible={false}>
                👤
              </Text>
              <View>
                <Text style={styles.userGreeting}>Halo,</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.logoutBtn}
              onPress={async () => {
                await logout();
                router.replace('/');
              }}
              accessibilityRole="button"
              accessibilityLabel="Keluar dari akun"
              accessibilityHint="Menghapus token dari penyimpanan aman dan kembali ke halaman masuk"
            >
              <Text style={styles.logoutBtnText}>⏻ Keluar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.authRow}>
            <Pressable
              style={[styles.loginBtn, isLoginActive && styles.authBtnActive]}
              onPress={() => navigateTo('/login')}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke akun"
              accessibilityState={{ selected: isLoginActive }}
            >
              <Text style={[styles.loginBtnText, isLoginActive && styles.loginBtnTextActive]}>
                🔐 Masuk
              </Text>
            </Pressable>

            <Pressable
              style={[styles.registerBtn, isRegisterActive && styles.registerBtnActive]}
              onPress={() => navigateTo('/register')}
              accessibilityRole="button"
              accessibilityLabel="Daftar akun baru"
              accessibilityState={{ selected: isRegisterActive }}
            >
              <Text style={styles.registerBtnText}>✍️ Daftar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Navigation Links Scrollable Bar */}
      <View style={styles.navBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navScroll}
        >
          {MAIN_NAV.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Pressable
                key={item.href}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => navigateTo(item.href)}
                accessibilityRole="button"
                accessibilityLabel={`Menu ${item.label}`}
                accessibilityState={{ selected: isActive }}
                accessibilityHint={`Membuka halaman ${item.label}`}
              >
                <Text style={styles.navItemIcon} accessible={false}>
                  {item.icon}
                </Text>
                <Text
                  style={[
                    styles.navItemText,
                    isActive && styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeDot} accessible={false} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 999,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        boxShadow: '0 2px 8px rgba(23, 105, 170, 0.08)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4E3F5',
  },
  brandIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#173C67',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10.5,
    color: '#596579',
    fontWeight: '500',
    marginTop: -2,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF4FB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    maxWidth: 160,
  },
  userAvatarIcon: {
    fontSize: 14,
  },
  userGreeting: {
    fontSize: 10,
    color: '#596579',
    lineHeight: 12,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1769AA',
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  logoutBtnText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE3EE',
    backgroundColor: '#FFFFFF',
  },
  loginBtnText: {
    color: '#173C67',
    fontSize: 13,
    fontWeight: '600',
  },
  authBtnActive: {
    borderColor: '#1769AA',
    backgroundColor: '#EEF4FB',
  },
  loginBtnTextActive: {
    color: '#1769AA',
    fontWeight: '700',
  },
  registerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1769AA',
  },
  registerBtnActive: {
    backgroundColor: '#0F4D7E',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  navBar: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4FA',
    backgroundColor: '#FAFCFE',
  },
  navScroll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: '#E6F0FA',
  },
  navItemIcon: {
    fontSize: 14,
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#596579',
  },
  navItemTextActive: {
    color: '#1769AA',
    fontWeight: '700',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1769AA',
    marginLeft: 2,
  },
});
