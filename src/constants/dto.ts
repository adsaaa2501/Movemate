/**
 * Data Transfer Object (DTO) — Week 4.
 *
 * Menerjemahkan bentuk JSON mentah dari server ke tipe data
 * yang dibutuhkan UI MoveMate, sehingga komponen layar tidak pernah
 * menyimpulkan struktur response server sendiri.
 */

/* ── Bentuk mentah dari server ─────────────────────────────────────────── */

export type RawVehicle = {
  id: string;
  name: string;
  price: number | string;
};

export type RawUser = {
  id: string;
  name: string;
  email: string;
};

export type RawOrder = {
  id: string;
  userId?: string;
  // Field detail barang (extended server)
  itemName?: string;
  weightKg?: number | string;
  notes?: string;
  // Field lama sebagai fallback
  itemDescription?: string;
  pickup: string;
  destination: string;
  vehicle?: string;
  vehicleId?: string;
  vehicleName?: string;
  schedule: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
};

/* ── Tipe yang dipakai UI ──────────────────────────────────────────────── */

export type VehicleInfo = {
  id: string;
  name: string;
  /** Harga sewa armada per pesanan (Rp). */
  price: number;
};

export type OrderStatus =
  | 'menunggu'
  | 'dikonfirmasi'
  | 'dalam_perjalanan'
  | 'selesai'
  | 'dibatalkan';

export type OrderInfo = {
  id: string;
  itemName: string;
  weightKg: number;
  notes: string;
  pickup: string;
  destination: string;
  vehicleId: string;
  vehicleName: string;
  /** Estimasi biaya total (armada + Rp 5.000/kg). */
  estimasiBiaya: number;
  schedule: string;
  status: OrderStatus;
  paymentStatus: string;
  /** Tanggal pesanan dibuat (ISO). */
  tanggalPesan: string;
};

/** Konversi status API → status yang dipahami (dan diberi warna) oleh UI. */
function mapStatus(raw: string): OrderStatus {
  switch (raw) {
    case 'menunggu_pembayaran':
      return 'menunggu';
    case 'diproses':
      return 'dikonfirmasi';
    case 'dalam_perjalanan':
      return 'dalam_perjalanan';
    case 'selesai':
      return 'selesai';
    case 'dibatalkan':
      return 'dibatalkan';
    default:
      return 'menunggu';
  }
}

/** Konversi armada dari API. */
export function toVehicle(raw: RawVehicle): VehicleInfo {
  const price = Number(raw.price);
  return {
    id: String(raw.id),
    name: String(raw.name),
    price: Number.isFinite(price) ? price : vehicleBasePrice(String(raw.name)),
  };
}

function parseWeight(raw: RawOrder): number {
  const weight = Number(raw.weightKg ?? 0);
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

/** Konversi pesanan mentah menjadi OrderInfo untuk kartu riwayat. */
export function toOrder(raw: RawOrder): OrderInfo {
  const weight = parseWeight(raw);
  const vehicleName = raw.vehicleName ?? raw.vehicle ?? 'Armada pilihan';
  const vehicleId = String(raw.vehicleId ?? '');

  return {
    id: String(raw.id),
    itemName: String(raw.itemName ?? raw.itemDescription ?? 'Pesanan barang'),
    weightKg: weight,
    notes: String(raw.notes ?? ''),
    pickup: String(raw.pickup),
    destination: String(raw.destination),
    vehicleId,
    vehicleName,
    estimasiBiaya: vehicleBasePrice(vehicleName) + weight * 5000,
    schedule: String(raw.schedule),
    status: mapStatus(String(raw.status)),
    paymentStatus: String(raw.paymentStatus ?? 'belum_dibayar'),
    tanggalPesan: new Date(raw.createdAt).toISOString(),
  };
}

/** Harga armada menurut jenis (menyamai konstanta server). */
export function vehicleBasePrice(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('truck') || lower.includes('truk')) return 200000;
  if (lower.includes('pickup')) return 100000;
  return 25000; // motor / default
}

/** Format nominal Rupiah untuk tampilan. */
export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}
