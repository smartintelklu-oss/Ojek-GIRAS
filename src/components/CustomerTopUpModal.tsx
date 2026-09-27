import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  QrCode,
  Building2,
  Store,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  History,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { TopUpTransaction } from '../types';
import { realtimeStore } from '../services/realtimeStore';

interface CustomerTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
  initialAmount?: number;
}

type PaymentCategory = 'QRIS' | 'VA' | 'EWALLET' | 'RETAIL' | 'DEBIT';

interface PaymentProvider {
  id: string;
  name: string;
  category: PaymentCategory;
  adminFee: number;
  badge?: string;
  logoText: string;
  logoBg: string;
  logoTextColor: string;
  vaPrefix?: string;
  instructions: string[];
}

const PAYMENT_PROVIDERS: PaymentProvider[] = [
  // 1. QRIS
  {
    id: 'qris_instant',
    name: 'QRIS Instant (Semua Bank & E-Wallet)',
    category: 'QRIS',
    adminFee: 0,
    badge: 'Tercepat & Gratis',
    logoText: 'QRIS',
    logoBg: 'bg-rose-600',
    logoTextColor: 'text-white',
    instructions: [
      'Buka aplikasi mobile banking (BCA, Mandiri, BRI, BNI, BSI) atau e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja).',
      'Pilih menu "Bayar" atau "Scan QRIS".',
      'Arahkan kamera ke kode QRIS dinamis di layar ini.',
      'Periksa nominal dan klik "Bayar" dengan PIN Anda.'
    ]
  },
  // 2. Virtual Account
  {
    id: 'va_bca',
    name: 'BCA Virtual Account',
    category: 'VA',
    adminFee: 0,
    badge: 'Otomatis 24 Jam',
    logoText: 'BCA',
    logoBg: 'bg-blue-700',
    logoTextColor: 'text-white',
    vaPrefix: '88012',
    instructions: [
      'Buka aplikasi BCA Mobile / myBCA / KlikBCA.',
      'Pilih menu m-Transfer > BCA Virtual Account.',
      'Masukkan Nomor Virtual Account yang tertera.',
      'Pastikan nama penerima adalah "OJEK ONLINE - RIAN PRATAMA".',
      'Masukkan PIN m-BCA Anda untuk menyelesaikan transaksi.'
    ]
  },
  {
    id: 'va_mandiri',
    name: 'Mandiri Virtual Account (Livin)',
    category: 'VA',
    adminFee: 0,
    badge: 'Otomatis 24 Jam',
    logoText: 'MDR',
    logoBg: 'bg-amber-600',
    logoTextColor: 'text-white',
    vaPrefix: '89022',
    instructions: [
      'Buka aplikasi Livin by Mandiri.',
      'Pilih menu "Bayar" > cari "Ojek Online Top Up" atau Masukkan No. Virtual Account.',
      'Masukkan Nomor VA Mandiri Anda.',
      'Konfirmasi tagihan lalu masukkan PIN Livin Mandiri.'
    ]
  },
  {
    id: 'va_bri',
    name: 'BRI Virtual Account (BRIVA)',
    category: 'VA',
    adminFee: 0,
    badge: 'Otomatis 24 Jam',
    logoText: 'BRI',
    logoBg: 'bg-blue-600',
    logoTextColor: 'text-white',
    vaPrefix: '12845',
    instructions: [
      'Buka aplikasi BRImo.',
      'Pilih menu "BRIVA" > Tambah Transaksi Baru.',
      'Masukkan Nomor BRIVA yang tertera.',
      'Konfirmasi rincian pembayaran dan masukkan PIN BRImo.'
    ]
  },
  {
    id: 'va_bni',
    name: 'BNI Virtual Account',
    category: 'VA',
    adminFee: 0,
    badge: 'Otomatis 24 Jam',
    logoText: 'BNI',
    logoBg: 'bg-teal-700',
    logoTextColor: 'text-white',
    vaPrefix: '8241',
    instructions: [
      'Buka BNI Mobile Banking.',
      'Pilih menu "Transfer" > "Virtual Account Billing".',
      'Masukkan Nomor VA BNI.',
      'Periksa nominal dan masukkan Password Transaksi.'
    ]
  },
  {
    id: 'va_bsi',
    name: 'BSI (Bank Syariah Indonesia)',
    category: 'VA',
    adminFee: 0,
    badge: 'Syariah',
    logoText: 'BSI',
    logoBg: 'bg-emerald-700',
    logoTextColor: 'text-white',
    vaPrefix: '7120',
    instructions: [
      'Buka BSI Mobile.',
      'Pilih menu "Bayar" > "Institusi / Virtual Account".',
      'Masukkan Nomor Virtual Account BSI.',
      'Konfirmasi transaksi dan masukkan PIN BSI Mobile.'
    ]
  },
  // 3. E-Wallet Direct
  {
    id: 'ewallet_gopay',
    name: 'GoPay Direct',
    category: 'EWALLET',
    adminFee: 0,
    badge: 'Instan 1-Klik',
    logoText: 'GoPay',
    logoBg: 'bg-sky-500',
    logoTextColor: 'text-white',
    instructions: [
      'Pastikan aplikasi Gojek/GoPay terpasang pada ponsel Anda.',
      'Klik tombol "Buka GoPay & Konfirmasi".',
      'Periksa nominal dan masukkan PIN GoPay Anda.',
      'Saldo OjekPay akan bertambah seketika.'
    ]
  },
  {
    id: 'ewallet_dana',
    name: 'DANA Dompet Digital',
    category: 'EWALLET',
    adminFee: 0,
    badge: 'Instan',
    logoText: 'DANA',
    logoBg: 'bg-blue-500',
    logoTextColor: 'text-white',
    instructions: [
      'Aplikasi akan menghubungkan ke akun DANA Anda (0812-9876-5432).',
      'Konfirmasi pembayaran pada halaman DANA.',
      'Masukkan PIN DANA Anda untuk otorisasi.'
    ]
  },
  {
    id: 'ewallet_ovo',
    name: 'OVO Cash',
    category: 'EWALLET',
    adminFee: 0,
    badge: 'Instan',
    logoText: 'OVO',
    logoBg: 'bg-purple-600',
    logoTextColor: 'text-white',
    instructions: [
      'Notifikasi push akan dikirim ke nomor OVO Anda.',
      'Buka aplikasi OVO dan setujui pembayaran dalam 60 detik.',
      'Masukkan PIN OVO Anda.'
    ]
  },
  {
    id: 'ewallet_shopeepay',
    name: 'ShopeePay',
    category: 'EWALLET',
    adminFee: 0,
    badge: 'Cashback Koin',
    logoText: 'SPay',
    logoBg: 'bg-orange-600',
    logoTextColor: 'text-white',
    instructions: [
      'Aplikasi akan membuka halaman pembayaran ShopeePay.',
      'Konfirmasi pembayaran nominal isi saldo.',
      'Masukkan PIN ShopeePay.'
    ]
  },
  // 4. Retail / Minimarket
  {
    id: 'retail_indomaret',
    name: 'Indomaret / Ceriamart',
    category: 'RETAIL',
    adminFee: 0,
    badge: 'Bayar Tunai di Kasir',
    logoText: 'INDO',
    logoBg: 'bg-red-600',
    logoTextColor: 'text-white',
    vaPrefix: 'IDM-8829',
    instructions: [
      'Kunjungi gerai Indomaret atau Ceriamart terdekat.',
      'Sampaikan kepada kasir: "Mau bayar Top Up Ojek Online".',
      'Tunjukkan Kode Pembayaran atau Barcode ke kasir.',
      'Bayar sesuai nominal yang tertera dan simpan struk kasir.'
    ]
  },
  {
    id: 'retail_alfamart',
    name: 'Alfamart / Alfamidi / Dan+Dan',
    category: 'RETAIL',
    adminFee: 0,
    badge: 'Bayar Tunai di Kasir',
    logoText: 'ALFA',
    logoBg: 'bg-red-700',
    logoTextColor: 'text-white',
    vaPrefix: 'ALF-8829',
    instructions: [
      'Kunjungi gerai Alfamart, Alfamidi, atau Dan+Dan terdekat.',
      'Sampaikan kepada kasir: "Bayar Top Up Saldo Ojek Online".',
      'Sebutkan Kode Pembayaran kepada kasir.',
      'Bayar tunai ke kasir dan tunggu saldo masuk secara otomatis.'
    ]
  },
  // 5. Debit Card / OneKlik
  {
    id: 'debit_oneklik',
    name: 'BCA OneKlik / Debit Online',
    category: 'DEBIT',
    adminFee: 0,
    badge: 'Debit Instan',
    logoText: 'DEBIT',
    logoBg: 'bg-slate-800',
    logoTextColor: 'text-white',
    instructions: [
      'Gunakan kartu Debit GPN atau Mastercard/Visa yang telah terdaftar.',
      'Verifikasi dengan kode OTP yang dikirim via SMS.',
      'Saldo akan terpotong dari rekening dan masuk ke OjekPay.'
    ]
  }
];

const NOMINAL_PRESETS = [
  { value: 20000, label: 'Rp 20.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 100000, label: 'Rp 100.000', isPopular: true },
  { value: 200000, label: 'Rp 200.000' },
  { value: 500000, label: 'Rp 500.000' },
  { value: 1000000, label: 'Rp 1.000.000' }
];

export const CustomerTopUpModal: React.FC<CustomerTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = 100000
}) => {
  const [activeView, setActiveView] = useState<'SELECT' | 'PAYMENT' | 'SUCCESS' | 'HISTORY'>('SELECT');
  const [amount, setAmount] = useState<number>(initialAmount);
  const [customInput, setCustomInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>('QRIS');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PAYMENT_PROVIDERS[0]);
  
  // Current user balance & history
  const [userProfile, setUserProfile] = useState(() => realtimeStore.getCustomerProfile());
  const [copiedVa, setCopiedVa] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestTx, setLatestTx] = useState<TopUpTransaction | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Sync state from realtimeStore
  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe(() => {
      setUserProfile(realtimeStore.getCustomerProfile());
    });
    return () => unsubscribe();
  }, []);

  // Update initialAmount when prop changes
  useEffect(() => {
    if (initialAmount > 0) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  if (!isOpen) return null;

  const currentBalance = userProfile.walletBalance || 0;

  // Generate unique VA / Payment Code for demo
  const generatedVaNumber = selectedProvider.vaPrefix
    ? `${selectedProvider.vaPrefix}0812987654`
    : `8801081298765432`;

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomInput('');
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setCustomInput(rawVal);
    const num = Number(rawVal);
    if (!isNaN(num)) {
      setAmount(num);
    }
  };

  const handleCopyVa = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleProceedToPayment = () => {
    if (amount < 10000) {
      alert('Minimal nominal pengisian saldo adalah Rp 10.000');
      return;
    }
    setActiveView('PAYMENT');
  };

  const handleSimulateSuccess = () => {
    setIsProcessing(true);

    setTimeout(() => {
      let methodType: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'E_WALLET' | 'RETAIL' | 'DEBIT_CARD' = 'QRIS';
      if (selectedProvider.category === 'VA') methodType = 'VIRTUAL_ACCOUNT';
      if (selectedProvider.category === 'EWALLET') methodType = 'E_WALLET';
      if (selectedProvider.category === 'RETAIL') methodType = 'RETAIL';
      if (selectedProvider.category === 'DEBIT') methodType = 'DEBIT_CARD';

      const result = realtimeStore.topUpCustomerBalance(
        amount,
        selectedProvider.name,
        methodType,
        generatedVaNumber
      );

      setIsProcessing(false);
      setLatestTx(result.tx);
      setActiveView('SUCCESS');

      if (onSuccess) {
        onSuccess(result.newBalance);
      }
    }, 900);
  };

  const filteredProviders = PAYMENT_PROVIDERS.filter((p) => p.category === selectedCategory);

  return (
    <div
      id="customer-top-up-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Top Up Saldo OjekPay</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Instan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Saldo aktif: <strong className="text-emerald-700 font-mono">Rp {currentBalance.toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'HISTORY' ? 'SELECT' : 'HISTORY')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                activeView === 'HISTORY'
                  ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
              title="Riwayat Top Up"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Riwayat</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* VIEW 1: PILIH NOMINAL & METODE PEMBAYARAN */}
          {activeView === 'SELECT' && (
            <div className="space-y-4">
              
              {/* Saldo Information Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white flex items-center justify-between shadow-md">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider block">
                    Saldo OjekPay Anda
                  </span>
                  <div className="text-xl font-black font-mono">
                    Rp {currentBalance.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-emerald-100/90 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    Terlindungi saldo aman & siap digunakan
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                </div>
              </div>

              {/* STEP 1: PILIH NOMINAL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Pilih Nominal Pengisian</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Min. Rp 10.000</span>
                </div>

                {/* Nominal Preset Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {NOMINAL_PRESETS.map((p) => {
                    const isSelected = amount === p.value && !customInput;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleSelectPreset(p.value)}
                        className={`p-2.5 rounded-2xl border text-center transition-all relative ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black shadow-xs ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs block font-mono">{p.label}</span>
                        {p.isPopular && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-emerald-600 text-white text-[8px] font-black rounded-full shadow-xs">
                            POPULER
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input */}
                <div className="pt-1">
                  <div className="relative rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-xs font-black text-slate-400 font-mono">Rp</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Atau masukkan nominal lainnya..."
                      value={customInput ? Number(customInput).toLocaleString('id-ID') : ''}
                      onChange={handleCustomInputChange}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-black text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden font-mono"
                    />
                    {customInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomInput('');
                          setAmount(100000);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 2: PILIH METODE PEMBAYARAN */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Pilih Metode Pembayaran</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Gratis Biaya Admin
                  </span>
                </div>

                {/* Category Pill Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('QRIS');
                      setSelectedProvider(PAYMENT_PROVIDERS.find((p) => p.category === 'QRIS')!);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] ${
                      selectedCategory === 'QRIS'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS Instan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('VA');
                      setSelectedProvider(PAYMENT_PROVIDERS.find((p) => p.category === 'VA')!);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] ${
                      selectedCategory === 'VA'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Virtual Account (Bank)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('EWALLET');
                      setSelectedProvider(PAYMENT_PROVIDERS.find((p) => p.category === 'EWALLET')!);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] ${
                      selectedCategory === 'EWALLET'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>E-Wallet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('RETAIL');
                      setSelectedProvider(PAYMENT_PROVIDERS.find((p) => p.category === 'RETAIL')!);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] ${
                      selectedCategory === 'RETAIL'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Minimarket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('DEBIT');
                      setSelectedProvider(PAYMENT_PROVIDERS.find((p) => p.category === 'DEBIT')!);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] ${
                      selectedCategory === 'DEBIT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Kartu Debit</span>
                  </button>
                </div>

                {/* Provider List under Category */}
                <div className="space-y-2">
                  {filteredProviders.map((provider) => {
                    const isSelected = selectedProvider.id === provider.id;
                    return (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${provider.logoBg} ${provider.logoTextColor}`}
                          >
                            {provider.logoText}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{provider.name}</span>
                              {provider.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                                  {provider.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Verifikasi otomatis seketika • Biaya Rp 0
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PAYMENT SUMMARY FOOTER BAR */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Nominal Pengisian:</span>
                  <span className="font-mono font-bold text-slate-900">Rp {amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Biaya Layanan / Admin:</span>
                  <span className="font-mono font-bold text-emerald-600">Gratis (Rp 0)</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Tagihan</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      Rp {amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={amount < 10000}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <span>Lanjutkan Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* VIEW 2: HALAMAN INSTRUKSI PEMBAYARAN INTERAKTIF */}
          {activeView === 'PAYMENT' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Back button & title */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveView('SELECT')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold py-1 px-2 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Metode / Nominal</span>
                </button>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Batas Waktu: 14:59
                </span>
              </div>

              {/* Total Tagihan Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total yang Harus Dibayar
                </span>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  Rp {amount.toLocaleString('id-ID')}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 pt-1">
                  <span className="font-semibold">{selectedProvider.name}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-emerald-700 font-bold">Bebas Biaya Admin</span>
                </div>
              </div>

              {/* INSTRUCTION DETAIL SESUAI METODE */}
              {selectedProvider.category === 'QRIS' ? (
                /* QRIS INTERACTIVE CODE */
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">QRIS</span>
                    <span>NMID: ID1029384756910</span>
                  </div>

                  {/* QRIS Visual Mock Box */}
                  <div className="relative mx-auto w-48 h-48 bg-white p-3 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center shadow-inner group">
                    {/* SVG Realistic QR Code Grid */}
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-slate-900"
                      fill="currentColor"
                    >
                      {/* Standard QR Corner Finders */}
                      <rect x="0" y="0" width="30" height="30" rx="4" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" />

                      <rect x="70" y="0" width="30" height="30" rx="4" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" />

                      <rect x="0" y="70" width="30" height="30" rx="4" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" />

                      {/* Data dots pattern */}
                      <rect x="36" y="5" width="6" height="6" />
                      <rect x="48" y="5" width="6" height="6" />
                      <rect x="58" y="12" width="6" height="6" />
                      <rect x="36" y="20" width="6" height="6" />
                      <rect x="48" y="20" width="6" height="6" />
                      <rect x="58" y="25" width="6" height="6" />

                      <rect x="5" y="36" width="6" height="6" />
                      <rect x="18" y="44" width="6" height="6" />
                      <rect x="25" y="36" width="6" height="6" />
                      <rect x="5" y="55" width="6" height="6" />
                      <rect x="18" y="58" width="6" height="6" />

                      <rect x="36" y="36" width="28" height="28" fill="#059669" rx="6" />
                      <circle cx="50" cy="50" r="8" fill="white" />

                      <rect x="72" y="36" width="6" height="6" />
                      <rect x="85" y="44" width="6" height="6" />
                      <rect x="72" y="55" width="6" height="6" />
                      <rect x="88" y="60" width="6" height="6" />

                      <rect x="36" y="72" width="6" height="6" />
                      <rect x="48" y="80" width="6" height="6" />
                      <rect x="58" y="72" width="6" height="6" />
                      <rect x="42" y="90" width="6" height="6" />
                      <rect x="55" y="90" width="6" height="6" />
                      <rect x="72" y="75" width="6" height="6" />
                      <rect x="84" y="85" width="6" height="6" />
                      <rect x="75" y="92" width="6" height="6" />
                    </svg>

                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[8px] font-black tracking-widest uppercase">
                        OJEKPAY QRIS
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Scan kode QRIS ini menggunakan aplikasi <strong>BCA, BRI, Mandiri, BNI, GoPay, OVO, DANA</strong>, atau mobile banking lainnya.
                  </p>
                </div>
              ) : selectedProvider.category === 'VA' ? (
                /* VIRTUAL ACCOUNT CODE */
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Nomor Virtual Account:</span>
                    <span className="text-[11px] font-bold text-blue-600">{selectedProvider.name}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-lg font-black font-mono tracking-wider text-slate-900 select-all">
                        {generatedVaNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Atas Nama: <strong className="text-slate-800">OJEK ONLINE - RIAN PRATAMA</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyVa(generatedVaNumber)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        copiedVa
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedVa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              ) : selectedProvider.category === 'RETAIL' ? (
                /* RETAIL MINIMARKET CASHIER CODE */
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Kode Pembayaran Kasir:</span>
                    <span className="text-[11px] font-bold text-red-600">{selectedProvider.name}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xl font-black font-mono tracking-wider text-slate-900 select-all">
                        {generatedVaNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Berikan kode ini kepada kasir minimarket
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyVa(generatedVaNumber)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        copiedVa
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedVa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {/* Cashier Barcode simulation */}
                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="h-10 w-full flex items-center justify-center gap-1 font-mono tracking-widest text-slate-800 text-xs">
                      |||||| | ||||| |||| ||||| |||| ||| |||||||
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">BARCODE SCAN KASIR</span>
                  </div>
                </div>
              ) : (
                /* E-WALLET / DEBIT DIRECT */
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${selectedProvider.logoBg} ${selectedProvider.logoTextColor}`}>
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{selectedProvider.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Akun terhubung: <strong className="text-slate-800">0812-9876-5432</strong>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Otorisasi instan saldo akan langsung masuk tanpa perlu unggah bukti transfer.
                  </p>
                </div>
              )}

              {/* COLLAPSIBLE STEP-BY-STEP INSTRUCTIONS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full p-3 flex items-center justify-between text-xs font-extrabold text-slate-800 bg-slate-50/70 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>Petunjuk Cara Pembayaran</span>
                  </span>
                  {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showInstructions && (
                  <div className="p-3.5 space-y-2 text-xs text-slate-600 border-t border-slate-100">
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      {selectedProvider.instructions.map((inst, idx) => (
                        <li key={idx} className="text-slate-700">
                          <span>{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* ACTION: SIMULASI BAYAR SEKARANG (REALISTIC INSTANT CONFIRMATION) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Sistem Menunggu Pembayaran Anda</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Dalam mode prototype demo, Anda dapat menekan tombol verifikasi di bawah ini untuk mensimulasikan pembayaran yang telah selesai secara instan.
                </p>

                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saya Sudah Bayar (Konfirmasi Instan)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* VIEW 3: SUKSES & STRUK DIGITAL (RECEIPT) */}
          {activeView === 'SUCCESS' && latestTx && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200 py-2">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Top Up Saldo Berhasil!</h3>
                <p className="text-xs text-slate-500">
                  Saldo OjekPay Anda telah bertambah dan siap digunakan.
                </p>
              </div>

              {/* STRUK TRANSAKSI DIGITAL */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-3 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-900">Struk Top Up OjekPay</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                    LUNAS
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>No. Referensi:</span>
                    <span className="font-mono font-bold text-slate-900">{latestTx.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Waktu Transaksi:</span>
                    <span className="font-mono text-slate-700">
                      {new Date(latestTx.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Metode Pembayaran:</span>
                    <span className="font-bold text-slate-900">{latestTx.providerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Nominal Top Up:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {latestTx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Layanan:</span>
                    <span className="font-mono font-bold text-emerald-600">Rp 0 (Gratis)</span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Saldo OjekPay Baru:</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      Rp {(userProfile.walletBalance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('SELECT');
                    setAmount(100000);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Top Up Lagi
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  Selesai & Pakai Saldo
                </button>
              </div>

            </div>
          )}

          {/* VIEW 4: RIWAYAT TRANSAKSI TOP UP */}
          {activeView === 'HISTORY' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase">Riwayat Top Up Saldo</h4>
                <button
                  type="button"
                  onClick={() => setActiveView('SELECT')}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-bold"
                >
                  + Isi Saldo Baru
                </button>
              </div>

              {(!userProfile.topUpHistory || userProfile.topUpHistory.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-medium">Belum ada riwayat pengisian saldo.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
                  {userProfile.topUpHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{tx.providerName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-100 text-emerald-800">
                              SUKSES
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            {new Date(tx.timestamp).toLocaleString('id-ID')} • {tx.id}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-700 font-mono block">
                          +Rp {tx.amount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Masuk OjekPay</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveView('SELECT')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Kembali ke Formulir Top Up
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
