# MoveMate 🚐📦

Aplikasi pemesanan jasa pindahan (moving service) berbasis **Expo (React Native)** yang mendemokan materi **Week 2–7 Mata Kuliah Pemrograman Mobile**: UI & aksesibilitas, autentikasi + penyimpanan aman, REST API + DTO, endpoint terproteksi Bearer Token, penanganan kegagalan jaringan, serta Google Maps & kamera.

Dibangun dengan: Expo SDK 58 · React Native 0.88 · Expo Router · TypeScript · Express (server lokal `server/`).

---

## 1. Cara Menjalankan

### a. Jalankan server API lokal (wajib)

```bash
npm run server
```

Server berjalan di `http://localhost:3001`. Log aktivitas (register/login/pesanan) tampil langsung di terminal.

### b. Jalankan aplikasi

```bash
npx expo start
```

| Target | Cara |
| --- | --- |
| **HP fisik (Android/iOS)** | Scan QR dengan **Expo Go** — pastikan HP satu Wi-Fi dengan PC/Laptop |
| **Web browser** | Tekan `w` di terminal, atau `npx expo start --web` |
| **Emulator Android** | Tekan `a` (perlu Android Studio installed), server otomatis dipetakan ke `10.0.2.2:3001` |

### c. URL API mengikuti perangkat otomatis (`src/constants/api.ts`)

- Web → `http://localhost:3001`
- HP fisik via Expo Go → IP komputer tempat Expo berjalan (dibaca dari `Constants.expoConfig.hostUri`)
- Emulator Android → `http://10.0.2.2:3001` (alias host dari dalam emulator)

---

## 2. Pemetaan Kriteria 6 Minggu Task → Implementasi

| Week | Kriteria | Implementasi (file) |
| --- | --- | --- |
| **2** | UI halaman login & integrasi | `src/app/login.tsx`, `src/app/register.tsx` — validasi form (email regex, password), state loading/error |
| **2** | Halaman sesuai kebutuhan | 9 layar: beranda `index.tsx`, `booking.tsx` (3 langkah), `order.tsx`, `map.tsx`, `camera.tsx`, `tracking.tsx`, `sensor.tsx`, `login.tsx`, `register.tsx` |
| **2** | Responsive & orientasi | `index.tsx` memakai `useWindowDimensions` → grid 1/2/3 kolom; `booking.tsx` dropdown armada menyesuaikan lebar; `app.json` `orientation: "all"` (portrait & landscape) |
| **2** | Aksesibilitas | Semua tombol memakai `accessibilityRole/Label/Hint/State`, input memakai `accessibilityLabel`, pesan error memakai `role="alert"`, pilihan armada `role="radio"`, tab filter `role="tab"`, target sentuh minimal **44 pt** |
| **3** | Native module module SecureStorage | Token & data user disimpan via `expo-secure-store` (`src/constants/storage.ts`), sesi otomatis dimuat ulang saat aplikasi dibuka |
| **3** | Register & login cek ke server | `POST /api/auth/register` (cek email unik, password ≥ 8) & `POST /api/auth/login` di `server/server.cjs`; UI tidak memalsukan sukses — salah password → `401` ditampilkan |
| **3** | Halaman status login | `register.tsx` → otomatis login setelah daftar; login/logout mengubah seluruh bar menu navbar; halaman login menampilkan kondisi "sudah masuk" |
| **3** | Keamanan & responsive halaman web | Tidak ada data sensitif di pesan error (helper `toMessage`); versi web: `booking.web.tsx`, `map.web.tsx`, `app-tabs.web.tsx`, `use-color-scheme.web.ts` |
| **4** | REST API | Server Express: `GET /api/vehicles`, `POST /api/orders`, dll. (daftar lengkap di §5) |
| **4** | DTO mapping | `src/constants/dto.ts` — `RawVehicle→VehicleInfo`, `RawOrder→OrderInfo` + mapping status (`menunggu_pembayaran→menunggu`, `diproses→dikonfirmasi`) & `formatRupiah` |
| **4** | Data di UI bukan hardcode | Armada, harga, dan riwayat pesanan dimuat dari API (`order-service.ts`); UI punya state loading/error/success |
| **5** | Token authentication | `request()` selalu menyisipkan `Authorization: Bearer <token>` untuk endpoint yang butuh; token asli dari server, bukan palsu |
| **5** | Endpoint terproteksi | `GET/POST /api/orders`, `PATCH /api/orders/:id/*`, `GET /api/auth/me` — **hanya merespons dengan token**; tanpa token → `401` (terlihat saat membuka halaman *Pesanan* tanpa login) |
| **5** |Logout/invalid token | `POST /api/auth/logout` menghapus sesi server; `GET /api/auth/me` yang kembali `401` otomatis membersihkan sesi di perangkat |
| **6** | Kasus 1 `success: true` | Login benar / order dibuat → alert sukses + navigasi |
| **6** | Kasus 2 `success: false` (HTTP error) | `ApiError` type `unauthorized/client/server` dengan pesan berbeda-beda (🔐 / ⚠️) |
| **6** | Kasus 3 timeout | `AbortController`: auth **5 s**, data **8 s** → pesan "Waktu tunggu habis" (⏱). Uji cepat: `GET /api/debug/slow?ms=9000` |
| **6** | Kasus 4 tanpa internet | `fetch` gagal (server tak terjangkau) → `ApiError` type `network`, UI menampilkan banner 📡 "Tidak dapat menghubungi server..." (lihat login/register/booking saat server dimatikan) |
| **7** | Google Maps | `src/app/map.tsx`: `react-native-maps` (MapGoogle provider), ketuk peta menandai titik penjemputan & tujuan, tombol **Gunakan untuk Pesanan** mengirim koordinat (`lat,lng`) ke halaman booking |
| **7** | Sensor & izin | `expo-location`: `requestForegroundPermissionsAsync` + `getCurrentPositionAsync` (tombol 📡 Lokasi Saya), penanganan izin ditolak dengan fallback; `sensor.tsx` membaca **accelerometer** (expo-sensors); izin dideklarasikan via config plugin di `app.json` (teks bahasa Indonesia) |
| **7** | Kamera | `src/app/camera.tsx`: izin kamera, `CameraView.takePictureAsync`, pratinjau + tombol **Lampirkan ke Pesanan** → `photo-store.ts` (row singleton, kedaluwarsa 30 menit) → foto tampil di langkah konfirmasi booking |

> **Versi web**: `react-native-maps` dan sensor HP tidak tersedia di browser, sehingga `booking.web.tsx` memakai alamat teks dan `map.web.tsx` menjadi penjelas + pintasan ke halaman pesanan — keduanya tetap terhubung ke alur yang sama.

### Alur data pesanan (Week 4+5)

1. Buka **Peta** → pilih titik keberangkatan & tujuan (atau kosongkan, isi alamat teks di web)
2. **Booking** → pilih armada dari API, isi barang/berat/jadwal → **Konfirmasi** → `POST /api/orders` (Bearer)
3. **Pesanan** → `GET /api/orders` (Bearer) → daftar milik user saja, ada tombol **Batalkan** (`PATCH .../status`)

---

## 3. Uji Kegagalan Jaringan (Week 6 diminimakan)

| Skenario | Langkah | Hasil di aplikasi |
| --- | --- | --- |
| Sukses | Login dengan akun terdaftar | Token disimpan, masuk ke beranda |
| HTTP 401 | Salah password / token kadaluarsa | 🔐 "Email atau password salah" / prompt login ulang |
| HTTP 409/400 | Daftar dengan email yang sudah dipakai / password < 8 | ⚠️ pesan dari server |
| Timeout | Pindahkan `request` endpoint ke `GET /api/debug/slow?ms=15000` atau matikan pengembalian server sejenak | ⏱ "Waktu tunggu habis..." |
| Tanpa internet | Matikan Wi-Fi/host server lalu buka halaman apa pun yang ambil data | 📡 "Tidak dapat menghubungi server..." |

Skenario timeout bisa diuji cepat: pada `booking.tsx` → data armada memakai URL `/api/vehicles`; ganti sementara ke `/api/debug/slow?ms=15000` (di `order-service.ts`) dan jalankan ulang.

---

## 4. Aksesibilitat (ringkas)

- Nama aksesibel pada seluruh kontrol: `accessibilityLabel`/$ (Indonesia);
- Tombol utama memiliki `accessibilityHint`, toggle memakai `accessibilityState { selected }`, tombol disable memakai `accessibilityState { disabled }`;
- Pesan error memakai `accessibilityRole="alert"` supaya dibacakan otomatis pembaca layar;
- Tanggapan sentuh: semua elemen interaktif ≥ 44 pt tinggi.

---

## 5. Endpoint Server (`server/server.cjs`, port 3001)

| Method | Endpoint | Auth? | Fungsi |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Cek apakah server hidup |
| GET | `/api/vehicles` | – | Daftar armada (motor, pickup, truck) + harga |
| POST | `/api/auth/register` | – | Daftar akun (email unik, password ≥ 8) |
| POST | `/api/auth/login` | – | Login → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Profil sesi aktif |
| POST | `/api/auth/logout` | Bearer | Tutup sesi server |
| GET | `/api/orders` | Bearer | Daftar pesanan milik sesi |
| POST | `/api/orders` | Bearer | Buat pesanan (nama barang, berat, armada, jadwal, alamat) |
| PATCH | `/api/orders/:id/payment` | Bearer | Ubah status pembayaran |
| PATCH | `/api/orders/:id/status` | Bearer | Ubah status pesanan (mis. `dibatalkan`) |
| GET | `/api/admin/users` | – | Log pengguna terdaftar (untuk praktikum) |
| GET | `/api/admin/sessions` | – | Log sesi login (untuk praktikum) |
| GET | `/api/debug/slow?ms=...` | – | Respons tertunda — demo timeout Week 6 |

---

## 6. Struktur Kode

```
MoveMateRebuild/
├─ server/server.cjs        # API lokal (Express) + log praktikum
├─ app.json                 # konfigurasi Expo (orientasi, plugin izin lokasi/kamera)
└─ src/
   ├─ app/                  # layar Expo Router
   │  ├─ login.tsx          ├─ register.tsx
   │  ├─ index.tsx          ├─ booking.tsx / booking.web.tsx
   │  ├─ order.tsx          ├─ map.tsx / map.web.tsx
   │  ├─ camera.tsx         ├─ tracking.tsx / sensor.tsx
   │  └─ _layout.tsx        # provider AuthProvider + Stack
   ├─ components/           # navbar, themed components, dsb.
   ├─ constants/
   │  ├─ api.ts             # base URL + request() + ApiError (timeout/network/HTTP)
   │  ├─ dto.ts             # DTO server → tipe UI + formatRupiah
   │  ├─ order-service.ts   # fungsi CRUD pesanan & armada (Bearer)
   │  ├─ auth-context.tsx   # provider AuthContext (login/register/logout/sesi)
   │  ├─ storage.ts         # SecureStore (token & data user)
   │  └─ photo-store.ts     # kirim foto kamera → booking
   └─ hooks/                # use-theme, use-color-scheme (+web)
```

## 7. Verifikasi Kualitas

```bash
npx tsc --noEmit   # typecheck — 0 error
npx eslint src     # lint (eslint-config-expo) — 0 error, 0 warning
```

Perintah di atas lulus sejak perubahan terakhir.
