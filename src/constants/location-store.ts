/**
 * Penyimpanan sementara hasil pemilihan lokasi (Week 7 — peta ↔ pesanan).
 *
 * Halaman Peta menyimpan titik penjemputan/tujuan yang dipilih di sini,
 * lalu halaman Booking membacanya saat kembali fokus (router.back()).
 * Modul ini level memory saja, mengikuti pola photo-store.ts: data hanya
 * dipakai antar dua layar tanpa perlu persistensi seperti token (SecureStore).
 */

export type LocationSelection = {
  pickup?: string;
  destination?: string;
};

let lastSelection: (LocationSelection & { savedAt: number }) | null = null;

/** Dipanggil halaman Peta setelah titik dipilih dan dikirim balik. */
export function saveLocationSelection(selection: LocationSelection): void {
  lastSelection = { ...selection, savedAt: Date.now() };
}

/**
 * Dipanggil halaman Booking saat kembali dari Peta;
 * pilihan kadaluarsa 30 menit dianggap tidak ada.
 */
export function consumeLocationSelection(): LocationSelection | null {
  if (!lastSelection) return null;
  const isFresh = Date.now() - lastSelection.savedAt <= 30 * 60 * 1000;
  const selection = isFresh ? lastSelection : null;
  lastSelection = null;
  return selection;
}
