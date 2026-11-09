/**
 * Modul inti komunikasi REST API (Week 4 & Week 5 & Week 6).
 *
 * - API_BASE_URL: otomatis mengikuti perangkat (web, emulator, atau HP fisik
 *   yang terhubung ke Expo Go) sehingga request selalu menunjuk ke server lokal.
 * - request(): helper fetch JSON dengan klasifikasi kegagalan yang JELAS
 *   (success / HTTP error / timeout / no internet) sesuai materi Week 6,
 *   dan otomatis mengirim header “Authorization: Bearer <token>” (Week 5).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Kategori kegagalan request — membedakan error server vs error jaringan. */
export type ApiErrorType =
  | 'unauthorized' // HTTP 401 — token hilang/invalid
  | 'client' // HTTP 4xx lainnya (validasi, dsb.)
  | 'server' // HTTP 5xx
  | 'timeout' // server tidak merespons dalam batas waktu
  | 'network'; // tidak ada internet / server tidak terjangkau

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;

  constructor(type: ApiErrorType, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

/**
 * Menentukan base URL API sesuai platform:
 * - Web (browser)         → localhost:3001
 * - HP fisik via Expo Go  → IP LAN tempat Expo berjalan (expoConfig.hostUri)
 * - Emulator Android      → 10.0.2.2 (alias host machine) sebagai fallback
 * - Simulator iOS         → localhost (satu mesin dengan server)
 */
function resolveBaseUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:3001';

  const config =
    (Constants as unknown as {
      expoConfig?: { hostUri?: string; debuggerHost?: string };
    }).expoConfig ?? null;

  const hostUri =
    (config && config.hostUri) ||
    (config && (config as { debuggerHost?: string }).debuggerHost) ||
    '';

  const host = hostUri ? hostUri.split(':')[0] : '';

  if (!host || host === 'localhost') {
    // Emulator Android tidak bisa memakai 'localhost';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
    return 'http://localhost:3001';
  }

  return `http://${host}:3001`;
}

export const API_BASE_URL = resolveBaseUrl();

const DEFAULT_TIMEOUT_MS = 8000;
const AUTH_TIMEOUT_MS = 5000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Access token → dikirim otomatis sebagai Bearer Token (Week 5). */
  token?: string | null;
  timeoutMs?: number;
};

function classifyHttpError(status: number, serverMessage?: string): ApiError {
  if (status === 401) {
    return new ApiError(
      'unauthorized',
      serverMessage ?? 'Sesi tidak valid atau berakhir. Silakan login kembali.',
      status
    );
  }
  if (status >= 500) {
    return new ApiError(
      'server',
      serverMessage ?? 'Terjadi kesalahan pada server. Coba lagi nanti.',
      status
    );
  }
  return new ApiError(
    'client',
    serverMessage ?? 'Permintaan tidak dapat diproses.',
    status
  );
}

/**
 * Request JSON ke API MoveMate.
 * Selalu melempar {@link ApiError} supaya layar UI bisa membedakan
 * HTTP error, timeout, dan hilangnya koneksi internet (materi Week 6).
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    timeoutMs = path.startsWith('/api/auth/') ? AUTH_TIMEOUT_MS : DEFAULT_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = (await response
        .json()
        .catch(() => null)) as { message?: string } | null;
      throw classifyHttpError(
        response.status,
        typeof data?.message === 'string' ? data.message : undefined
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ApiError(
        'client',
        'Respon server tidak valid (JSON tidak dapat dibaca).'
      );
    }
    return payload as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        'timeout',
        'Waktu tunggu habis: server tidak merespons tepat waktu.'
      );
    }

    // Fetch gagal bawaan (TypeError: Network request failed / Failed to fetch).
    throw new ApiError(
      'network',
      'Tidak dapat menghubungi server. Periksa koneksi internet.'
    );
  }
}

/* ── Endpoint Terproteksi (Week 5) ─────────────────────────────────────── */

/** GET /api/vehicles — data armada (publik) untuk halaman booking. */
export function fetchVehicles() {
  return request<{ id: string; name: string; price: number }[]>(
    '/api/vehicles'
  );
}
