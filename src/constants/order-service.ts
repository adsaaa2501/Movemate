/**
 * Layanan terproteksi (Week 5).
 *
 * Semua fungsi di modul ini mengirim token sesi melalui header
 * `Authorization: Bearer <token>`. Tanpa token, server membalas
 * 401 Unauthorized yang diangkat sebagai ApiError 'unauthorized'.
 */

import { request } from './api';
import { toOrder, toVehicle, type OrderInfo, type RawOrder, type VehicleInfo } from './dto';

/** GET /api/vehicles — daftar armada beserta harga dasar. */
export async function getVehicles(): Promise<VehicleInfo[]> {
  const raw = await request<{ id: string; name: string; price: number }[]>(
    '/api/vehicles'
  );
  return raw.map(toVehicle);
}

export type NewOrderPayload = {
  itemName: string;
  weightKg: number;
  notes: string;
  pickup: string;
  destination: string;
  vehicleId: string;
  vehicleName: string;
  schedule: string;
  photoNote?: boolean;
};

/** POST /api/orders — membuat pesanan (butuh token). */
export async function createOrder(
  payload: NewOrderPayload,
  token: string
): Promise<OrderInfo> {
  const data = await request<{ message: string; order: RawOrder }>(
    '/api/orders',
    {
      method: 'POST',
      token,
      body: {
        itemName: payload.itemName,
        weightKg: payload.weightKg,
        notes: payload.notes,
        pickup: payload.pickup,
        destination: payload.destination,
        vehicleId: payload.vehicleId,
        vehicleName: payload.vehicleName,
        schedule: payload.schedule,
        photoNote: payload.photoNote ? '1' : undefined,
      },
    }
  );
  return toOrder(data.order);
}

/** GET /api/orders — riwayat pesanan milik user sesi ini (butuh token). */
export async function getOrders(token: string): Promise<OrderInfo[]> {
  const raw = await request<RawOrder[]>('/api/orders', { token });
  return raw.map(toOrder);
}

/** PATCH /api/orders/:id/status — membatalkan pesanan (butuh token). */
export async function cancelOrder(
  orderId: string,
  token: string
): Promise<OrderInfo> {
  const data = await request<{ message: string; order: RawOrder }>(
    `/api/orders/${orderId}/status`,
    {
      method: 'PATCH',
      token,
      body: { status: 'dibatalkan' },
    }
  );
  return toOrder(data.order);
}
