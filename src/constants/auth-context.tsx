import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  saveAuthToken,
  saveUserData,
  getUserData,
  getAuthToken,
  removeAuthSession,
} from './storage';
import { request, ApiError } from './api';
import type { RawUser } from './dto';

type LoginOutcome = { success: boolean; message?: string };

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<LoginOutcome>;
  registerUser: (
    name: string,
    email: string,
    pass: string
  ) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  registerUser: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Muat sesi tersimpan saat aplikasi dibuka, lalu revalidasi ke server.
   * Semua setState berada di dalam callback promise (bukan sinkron di body effect).
   */
  useEffect(() => {
    let cancelled = false;

    // Token dipertahankan selama aplikasi digunakan (Week 5),
    // namun tetap dinilai ulang ke server: jika server membalas
    // 401 berarti sesi berakhir → bersihkan sesi di perangkat.
    const revalidate = (storedToken: string) =>
      request<RawUser>('/api/auth/me', { token: storedToken })
        .then((fresh) => {
          if (cancelled) return;
          setUser({
            id: fresh.id,
            name: fresh.name,
            email: fresh.email,
          } satisfies UserProfile);
          return saveUserData({ id: fresh.id, name: fresh.name, email: fresh.email });
        })
        .catch((err) => {
          if (cancelled) return;
          if (err instanceof ApiError && err.type === 'unauthorized') {
            return removeAuthSession().then(() => {
              setToken(null);
              setUser(null);
            });
          }
          // Error jaringan: tetap tampilkan sesi tersimpan (modus santai).
          return undefined;
        });

    Promise.all([getAuthToken(), getUserData()])
      .then(([storedToken, storedUser]) => {
        if (cancelled) return;
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          return revalidate(storedToken);
        }
        return undefined;
      })
      .catch(() => {
        // Abaikan kegagalan membaca storage.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** POST /api/auth/login — credential diperiksa server; token asli disimpan. */
  async function login(email: string, pass: string): Promise<LoginOutcome> {
    try {
      const data = await request<{
        message: string;
        token: string;
        user: RawUser;
      }>('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password: pass },
      });

      if (!data?.token || !data?.user) {
        return { success: false, message: 'Respon login tidak valid.' };
      }

      const profile: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      };
      await saveAuthToken(data.token);
      await saveUserData(profile);
      setToken(data.token);
      setUser(profile);
      return { success: true };
    } catch (err) {
      return {
      success: false,
      message: toMessage(err, 'Terjadi kesalahan saat masuk, coba lagi.'),
    };
    }
  }

  /**
   * POST /api/auth/register (server mengecek email unik, password ≥ 8),
   * lalu login otomatis agar sesi/token sama seperti alur login biasa.
   */
  async function registerUser(
    name: string,
    email: string,
    pass: string
  ): Promise<LoginOutcome> {
    try {
      await request<{ message: string; user: RawUser }>('/api/auth/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: pass,
        },
      });
      return await login(email, pass);
    } catch (err) {
      return {
        success: false,
        message: toMessage(err, 'Pendaftaran gagal, coba lagi.'),
      };
    }
  }

  /** Hapus token di server & di perangkat, lalu kembali ke belum login. */
  async function logout() {
    try {
      if (token) {
        await request('/api/auth/logout', {
          method: 'POST',
          token,
        }).catch(() => {
          // Server tetap memakai sesi kedaluwarsa sendiri; sesi lokal tetap dibersihkan.
        });
      }
    } catch {
      // Tidak memblokir logout lokal.
    }

    await removeAuthSession();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Pesan aman tanpa detail sensitif (Week 3). */
function toMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export function useAuth() {
  return useContext(AuthContext);
}
