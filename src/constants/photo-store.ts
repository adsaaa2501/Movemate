/**
 * Penyimpanan foto sementara (Week 7 — kamera ↔ pesanan).
 *
 * Kamera menyimpan foto terakhir di sini, lalu halaman Booking
 * menampilkannya pada langkah konfirmasi. Modul ini level memory saja:
 * foto tidak disimpan ke server karena API tidak memiliki endpoint upload.
 *
 * Dibuat sebagai modul singleton karena data hanya dipakai antar dua
 * layar tanpa perlu persistensi aman seperti token (SecureStore).
 */

export type AttachedPhoto = {
  uri: string;
  takenAt: number;
};

let lastPhoto: AttachedPhoto | null = null;

/** Dipanggil halaman Kamera setelah foto berhasil diambil. */
export function savePhotoForOrder(uri: string): void {
  lastPhoto = { uri, takenAt: Date.now() };
}

/** Dipanggil halaman Booking; foto kadaluarsa 30 menit dianggap tidak ada. */
export function consumePhotoForOrder(): AttachedPhoto | null {
  if (!lastPhoto) return null;
  const isFresh = Date.now() - lastPhoto.takenAt <= 30 * 60 * 1000;
  const photo = isFresh ? lastPhoto : null;
  lastPhoto = null;
  return photo;
}
