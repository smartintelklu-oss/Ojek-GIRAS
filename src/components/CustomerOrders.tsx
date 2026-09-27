import React from 'react';
import { OrderData } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Bike,
  Car,
  Package,
  Banknote,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Utensils,
  Store,
  Star
} from 'lucide-react';

interface CustomerOrdersProps {
  currentOrder: OrderData | null;
  onOpenRideBooking: () => void;
  onReset: () => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({
  currentOrder,
  onOpenRideBooking,
  onReset
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 bg-slate-50 text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Aktivitas & Riwayat Pesanan</h2>
          <p className="text-[11px] text-slate-500 font-medium">Pantau transaksi perjalanan dan belanja Anda</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Semua Riwayat
        </span>
      </div>

      {/* 1. ORDER SAAT INI (JIKA ADA) */}
      {currentOrder && (
        <div className="space-y-2">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-tight">
            Pesanan Terakhir / Aktif:
          </span>

          <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  currentOrder.serviceType === 'SHOPPING'
                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                    : currentOrder.serviceType === 'FOOD'
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : currentOrder.serviceType === 'SEND'
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : currentOrder.serviceType === 'CAR'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {currentOrder.serviceType === 'SHOPPING' ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : currentOrder.serviceType === 'FOOD' ? (
                    <Utensils className="w-5 h-5" />
                  ) : currentOrder.serviceType === 'SEND' ? (
                    <Package className="w-5 h-5" />
                  ) : currentOrder.serviceType === 'CAR' ? (
                    <Car className="w-5 h-5" />
                  ) : (
                    <Bike className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    {currentOrder.serviceType === 'SHOPPING' ? (currentOrder.merchantName || 'Belanja Toko Mitra') :
                     currentOrder.serviceType === 'FOOD' ? (currentOrder.merchantName || 'Ojek Food') :
                     currentOrder.serviceType === 'SEND' ? 'Paket Kilat (Kirim Barang)' :
                     currentOrder.serviceType === 'CAR' ? 'Ojek Car (Mobil)' :
                     'Ojek Motor (Ride)'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {currentOrder.orderId}</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                currentOrder.status === 'SEARCHING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                currentOrder.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                currentOrder.status === 'ON_TRIP' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                currentOrder.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {currentOrder.status === 'SEARCHING' ? 'Menyiapkan & Cari Kurir' :
                 currentOrder.status === 'ACCEPTED' ? 'Kurir Menuju Lokasi' :
                 currentOrder.status === 'ON_TRIP' ? 'Dalam Pengantaran' :
                 currentOrder.status === 'COMPLETED' ? 'Pesanan Selesai' :
                 'Dibatalkan'}
              </span>
            </div>

            {/* Detail Barang Belanja jika tipe SHOPPING */}
            {currentOrder.serviceType === 'SHOPPING' && currentOrder.items && currentOrder.items.length > 0 && (
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span>Barang Dipesan ({currentOrder.items.length} jenis):</span>
                  <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded-full font-extrabold">BELANJA</span>
                </div>
                <div className="space-y-1">
                  {currentOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono font-semibold">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                {currentOrder.customerConfirmedReceived && (
                  <div className="mt-1 pt-1 border-t border-purple-200 flex items-center gap-1 text-[11px] text-emerald-700 font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Barang Diterima & Terverifikasi (★ {currentOrder.rating || 5}.0)</span>
                  </div>
                )}
              </div>
            )}

            {/* Rincian Jenis Paket jika Paket Kilat */}
            {currentOrder.serviceType === 'SEND' && currentOrder.packageType && (
              <div className="p-2.5 bg-orange-50/90 rounded-xl border border-orange-200 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-orange-800 font-bold">
                  <Package className="w-3.5 h-3.5 text-orange-600" />
                  <span>Jenis Barang: <span className="font-extrabold text-orange-950">{currentOrder.packageType}</span></span>
                </div>
                {currentOrder.packageNotes && (
                  <p className="text-[11px] text-slate-600 pl-5">Catatan: {currentOrder.packageNotes}</p>
                )}
              </div>
            )}

            {/* Rute Jemput & Tujuan */}
            <div className="space-y-2 text-xs border-y border-slate-100 py-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {currentOrder.serviceType === 'SEND' ? 'Titik Pengambilan / Pengirim:' : 'Titik Jemput:'}
                  </span>
                  <span className="font-bold text-slate-800 block truncate">{currentOrder.origin.name}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {currentOrder.serviceType === 'SEND' ? 'Titik Penerima / Alamat Antar:' : 'Lokasi Tujuan:'}
                  </span>
                  <span className="font-bold text-slate-800 block truncate">{currentOrder.destination.name}</span>
                </div>
              </div>
            </div>

            {/* Driver & Pembayaran Info */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Metode Pembayaran:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-emerald-600 font-mono text-sm">
                    Rp {currentOrder.totalFare.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    currentOrder.paymentMethod === 'DIGITAL_WALLET'
                      ? 'bg-blue-100 text-blue-800'
                      : currentOrder.paymentMethod === 'QRIS'
                      ? 'bg-purple-100 text-purple-800'
                      : currentOrder.paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {currentOrder.paymentMethod === 'DIGITAL_WALLET' ? 'OjekPay' : currentOrder.paymentMethod === 'QRIS' ? 'QRIS' : currentOrder.paymentMethod === 'BANK_TRANSFER' ? 'Transfer VA' : 'Tunai'}
                  </span>
                  {currentOrder.isPaid ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Lunas
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Bayar di Tempat
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onOpenRideBooking}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors shadow-sm"
              >
                Buka Peta Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTOH RIWAYAT PESANAN SEBELUMNYA (HISTORY) */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
          Riwayat Transaksi & Belanja Selesai:
        </span>

        {/* Mock Past Order 0 - Belanja Toko Mitra */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block">Belanja • Toko Sembako Berkah Jaya</span>
                <span className="text-[10px] text-purple-600 font-bold">3 Barang: Minyak 2L, Beras 5kg, Telur 1kg</span>
              </div>
            </div>
            <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Selesai & Diterima
            </span>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <p className="truncate font-medium text-slate-800">🛍️ Toko Sembako Berkah ➔ 🏠 Rumah Pelanggan</p>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Barang Diterima (★ 5.0)</span>
              </div>
              <span className="font-black text-slate-900 font-mono">Rp 113.000</span>
            </div>
          </div>
        </div>

        {/* Mock Past Order 1 - Paket Kilat */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block">Paket Kilat (Express)</span>
                <span className="text-[10px] text-orange-600 font-bold">Barang: Dokumen Kantor & Ijazah</span>
              </div>
            </div>
            <span className="text-[10px] text-orange-700 font-bold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Selesai • Kemarin
            </span>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <p className="truncate font-medium text-slate-800">📦 Kantor Sudirman ➔ 🏁 Menara BCA Thamrin</p>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>Kurir: Hendra Wijaya (B 4182 TXY)</span>
              <span className="font-black text-slate-900 font-mono">Rp 15.000</span>
            </div>
          </div>
        </div>

        {/* Mock Past Order 2 */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Bike className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900">Ojek Motor</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Selesai • 2 Hari Lalu
            </span>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <p className="truncate font-medium text-slate-800">📍 Stasiun Manggarai ➔ 🏁 Plaza Indonesia</p>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>Driver: Agus Wicaksono (B 3321 KZA)</span>
              <span className="font-black text-slate-900 font-mono">Rp 12.000</span>
            </div>
          </div>
        </div>

        {/* Mock Past Order 3 */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Bike className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900">Ojek Motor</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Selesai • 5 Hari Lalu
            </span>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <p className="truncate font-medium text-slate-800">📍 Blok M Square ➔ 🏁 Senayan City</p>
            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>Driver: Joko Prasetyo (B 8729 ULM)</span>
              <span className="font-black text-slate-900 font-mono">Rp 10.500</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
