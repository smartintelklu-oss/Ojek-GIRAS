import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Star,
  ChevronRight,
  ShieldCheck,
  Award,
  Wallet,
  PlusCircle,
  Sparkles,
  History
} from 'lucide-react';
import { INITIAL_CUSTOMER } from '../data/mockLocations';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import { realtimeStore } from '../services/realtimeStore';

interface CustomerProfileProps {
  onReset: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ onReset }) => {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(() => realtimeStore.getCustomerProfile());

  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe(() => {
      setUserProfile(realtimeStore.getCustomerProfile());
    });
    return () => unsubscribe();
  }, []);

  const walletBalance = userProfile.walletBalance || 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 bg-slate-50 text-slate-800">
      
      {/* Profile Header Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3.5 shadow-sm">
        <img
          src={INITIAL_CUSTOMER.avatar}
          alt={INITIAL_CUSTOMER.name}
          className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover shadow-xs"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900">{INITIAL_CUSTOMER.name}</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
              VIP MEMBER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{INITIAL_CUSTOMER.phone}</p>
          <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{INITIAL_CUSTOMER.rating} Rating Penumpang</span>
          </div>
        </div>
      </div>

      {/* OjekPay Balance & Top Up Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Wallet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                Dompet Digital OjekPay
              </span>
              <span className="text-xl font-black font-mono">
                Rp {walletBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTopUpModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.97]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Top Up Saldo</span>
          </button>
        </div>

        <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-emerald-100/90">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Gunakan untuk Ride, Car, Food & Paket
          </span>
          <button
            type="button"
            onClick={() => setIsTopUpModalOpen(true)}
            className="text-white hover:underline flex items-center gap-1 font-bold"
          >
            <History className="w-3 h-3" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Account Settings Menu List */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight px-1">
          Pengaturan Akun & Keamanan
        </span>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs shadow-sm">
          
          <div
            onClick={() => setIsTopUpModalOpen(true)}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Metode Pembayaran & Top Up</span>
                <span className="text-[10px] text-slate-500">
                  OjekPay (Rp {walletBalance.toLocaleString('id-ID')}) • QRIS • VA • Tunai
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Isi Saldo
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Pusat Keamanan & Kontak Darurat</span>
                <span className="text-[10px] text-slate-500">Verifikasi 2 langkah & bagikan rute live</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Ojek Poin & Reward</span>
                <span className="text-[10px] text-slate-500">450 Poin terkumpul</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Pusat Bantuan & CS 24/7</span>
                <span className="text-[10px] text-slate-500">Laporkan kendala perjalanan</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

        </div>
      </div>

      {/* Reset Cache / Demo Data Button */}
      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Reset Data Demo Ojek Online</span>
      </button>

      {/* MODAL TOP UP SALDO */}
      <CustomerTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />

    </div>
  );
};
