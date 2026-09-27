import React, { useState, useEffect } from 'react';
import {
  Bike,
  Car,
  Package,
  Utensils,
  ShoppingBag,
  TicketPercent,
  Pill,
  Sparkles,
  Wallet,
  Coins,
  ChevronRight,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search,
  Clock,
  Compass,
  Zap,
  Tag,
  PlusCircle,
  Eye,
  EyeOff,
  History
} from 'lucide-react';
import { OrderData, LocationPoint } from '../types';
import { JAKARTA_LOCATIONS } from '../data/mockLocations';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import { realtimeStore } from '../services/realtimeStore';

interface CustomerHomeProps {
  currentOrder: OrderData | null;
  onOpenRideBooking: (destinationPreset?: LocationPoint, servicePreset?: 'RIDE' | 'CAR' | 'SEND' | 'FOOD') => void;
  onOpenCar?: () => void;
  onOpenFood?: () => void;
  onOpenSend?: () => void;
  onOpenShopping?: () => void;
  onOpenActivity: () => void;
  onOpenTopUp?: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  currentOrder,
  onOpenRideBooking,
  onOpenCar,
  onOpenFood,
  onOpenSend,
  onOpenShopping,
  onOpenActivity,
  onOpenTopUp
}) => {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [userProfile, setUserProfile] = useState(() => realtimeStore.getCustomerProfile());

  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe(() => {
      setUserProfile(realtimeStore.getCustomerProfile());
    });
    return () => unsubscribe();
  }, []);

  const walletBalance = userProfile.walletBalance || 0;

  const isOrderActive = currentOrder && (
    currentOrder.status === 'SEARCHING' ||
    currentOrder.status === 'ACCEPTED' ||
    currentOrder.status === 'ON_TRIP'
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 bg-slate-50 text-slate-800 selection:bg-emerald-500 selection:text-white">
      
      {/* 1. Header Profil & Notifikasi Member */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
              alt="Avatar Pengguna"
              className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-sm object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Halo, Rian Pratama</h2>
              <span className="text-sm animate-bounce">👋</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Mau jalan-jalan ke mana hari ini?</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-bold shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Member VIP</span>
        </div>
      </div>

      {/* 2. Quick Search / Destination Bar */}
      <button
        onClick={() => onOpenRideBooking()}
        className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
              Mau ke mana sekarang?
            </span>
            <span className="text-[11px] text-slate-500">Cari alamat atau pilih destinasi favorit</span>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* 3. ACTIVE ORDER BANNER (Tampil jika ada order berlangsung) */}
      {isOrderActive && (
        <div
          onClick={() => onOpenRideBooking()}
          className="p-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-emerald-900/20 transition-all shadow-md animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white text-emerald-700 font-black shadow-sm">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    PESANAN SEDANG BERLANGSUNG
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                </div>
                <p className="text-xs text-white font-bold truncate max-w-[200px]">
                  {currentOrder.status === 'SEARCHING'
                    ? 'Sedang mencari driver terdekat...'
                    : `Driver: ${currentOrder.driverName || 'Budi Santoso'} (${currentOrder.driverPlate || 'B 4920 SAK'})`}
                </p>
              </div>
            </div>
            <span className="text-xs text-white font-bold flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
              <span>Pantau Peta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* 4. Wallet & Payment Card (OjekPay & Top Up Cepat) */}
      <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Sisi Kiri: Saldo OjekPay */}
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Saldo OjekPay
                </span>
                <button
                  type="button"
                  onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                >
                  {isBalanceHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
                  {isBalanceHidden ? 'Rp •••••••' : `Rp ${walletBalance.toLocaleString('id-ID')}`}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-emerald-100 text-emerald-700 font-mono">
                  AKTIF
                </span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Tombol Top Up Utama */}
          <button
            type="button"
            onClick={() => {
              if (onOpenTopUp) {
                onOpenTopUp();
              } else {
                setIsTopUpModalOpen(true);
              }
            }}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-[0.97]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Top Up</span>
          </button>
        </div>

        {/* Baris Bawah: Poin & Metode Lain */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Ojek Poin: <strong className="text-amber-600 font-mono font-bold">450 Pts</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Bayar Tunai / Cash juga tersedia</span>
            <button
              type="button"
              onClick={() => setIsTopUpModalOpen(true)}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
            >
              <History className="w-3 h-3" />
              <span>Riwayat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. GRID MENU UTAMA DENGAN DEGRADASI WARNA DAN ICON MENARIK */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Layanan Ojek Online</h3>
            <p className="text-[10px] text-slate-500">Pilih kebutuhan transportasi & kirim harian Anda</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            8 Pilihan
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          
          {/* MENU 1: OJEK MOTOR (Ride - Gradient Hijau Emerald) */}
          <button
            onClick={() => onOpenRideBooking(undefined, 'RIDE')}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-500/40 transition-all duration-300 ring-2 ring-emerald-300/40">
              <Bike className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-black text-slate-800 mt-2 text-center group-hover:text-emerald-700 transition-colors">
              Ojek Ride
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Motor</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[8px] rounded-full shadow-xs uppercase tracking-wide">
              AKTIF
            </span>
          </button>

          {/* MENU 2: OJEK CAR (Mobil - Gradient Biru Royal) */}
          <button
            onClick={() => onOpenCar ? onOpenCar() : onOpenRideBooking(undefined, 'CAR')}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300 ring-2 ring-blue-300/40">
              <Car className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-blue-700 transition-colors">
              Ojek Car
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Mobil AC</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[8px] rounded-full shadow-xs uppercase">
              NYAMAN
            </span>
          </button>

          {/* MENU 3: PAKET KILAT (Kirim Barang - Gradient Oranye Hangat) */}
          <button
            onClick={() => {
              if (onOpenSend) {
                onOpenSend();
              } else {
                onOpenRideBooking(undefined, 'SEND');
              }
            }}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-orange-500/40 transition-all duration-300 ring-2 ring-orange-300/40">
              <Package className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-orange-700 transition-colors">
              Paket Kilat
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Ekspres</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-[8px] rounded-full shadow-xs uppercase">
              SAMEDAY
            </span>
          </button>

          {/* MENU 4: OJEK FOOD (Makanan - Gradient Merah Crimson) */}
          <button
            onClick={() => onOpenFood ? onOpenFood() : onOpenRideBooking(undefined, 'FOOD')}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-rose-500/40 transition-all duration-300 ring-2 ring-rose-300/40">
              <Utensils className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-rose-700 transition-colors">
              Ojek Food
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Kuliner</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-[8px] rounded-full shadow-xs uppercase">
              PROMO
            </span>
          </button>

          {/* MENU 5: BELANJA / MART (Gradient Ungu Violet) */}
          <button
            onClick={() => onOpenShopping ? onOpenShopping() : onOpenRideBooking()}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-purple-500/40 transition-all duration-300 ring-2 ring-purple-300/40">
              <ShoppingBag className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-purple-700 transition-colors">
              Belanja
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Toko Mitra</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-[8px] rounded-full shadow-xs uppercase">
              PRODUK
            </span>
          </button>

          {/* MENU 6: PROMO SPESIAL (Gradient Kuning Emas) */}
          <button
            onClick={() => onOpenRideBooking()}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-amber-500/40 transition-all duration-300 ring-2 ring-amber-300/40">
              <TicketPercent className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-amber-700 transition-colors">
              Promo
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Diskon</span>
            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[8px] rounded-full shadow-xs uppercase">
              HEMAT
            </span>
          </button>

          {/* MENU 7: APOTEK / OBAT (Gradient Cyan Teal) */}
          <button
            onClick={() => onOpenRideBooking()}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-teal-500/40 transition-all duration-300 ring-2 ring-teal-300/40">
              <Pill className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-teal-700 transition-colors">
              Apotek
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Obat Resep</span>
          </button>

          {/* MENU 8: LAINNYA / SEMUA LAYANAN (Gradient Slate Indigo) */}
          <button
            onClick={() => onOpenRideBooking()}
            className="flex flex-col items-center p-2 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-500 hover:shadow-md transition-all group relative active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 flex items-center justify-center text-white shadow-md shadow-slate-500/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-slate-500/40 transition-all duration-300 ring-2 ring-slate-400/40">
              <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 mt-2 text-center group-hover:text-slate-900 transition-colors">
              Lainnya
            </span>
            <span className="text-[9px] font-medium text-slate-500 text-center">Bantuan</span>
          </button>
        </div>
      </div>

      {/* 6. TUJUAN CEPAT / FAVORIT */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight px-0.5">
          Destinasi Cepat & Populer
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {JAKARTA_LOCATIONS.slice(1, 5).map((loc) => (
            <button
              key={loc.name}
              onClick={() => onOpenRideBooking(loc)}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all text-left flex items-start gap-2.5 group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-xs font-extrabold text-slate-900 block truncate group-hover:text-emerald-700 transition-colors">
                  {loc.name}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">{loc.address}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 7. BANNER PROMO DENGAN DEGRADASI WARNA CANTIK */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white space-y-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xs font-extrabold text-white tracking-wide">
            Tarif Pasti Ojek Online (Transparan)
          </span>
        </div>
        <p className="text-[11px] text-emerald-50 leading-relaxed font-normal">
          Tarif dasar Rp 8.000 untuk 2 km pertama, selanjutnya hanya Rp 2.500/km. Bayar tunai langsung ke driver tanpa biaya tersembunyi.
        </p>
        <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
          <span className="font-extrabold text-amber-200 bg-black/20 px-2 py-0.5 rounded">
            KODE: OJEKHEMAT
          </span>
          <button
            onClick={() => onOpenRideBooking()}
            className="text-xs font-black text-white hover:underline flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg hover:bg-white/30 transition-colors"
          >
            <span>Pesan Ojek</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MODAL TOP UP SALDO OJEKPAY */}
      <CustomerTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />

    </div>
  );
};
