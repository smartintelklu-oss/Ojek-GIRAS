import React, { useState, useMemo, useEffect } from 'react';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import {
  Package,
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  CreditCard,
  Wallet,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Scale,
  Box,
  KeyRound,
  FileText,
  HelpCircle,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  LocationPoint,
  OrderData,
  PackageItemDetail,
  ContactPerson,
  SendFareBreakdown
} from '../types';
import {
  JAKARTA_LOCATIONS,
  INITIAL_CUSTOMER,
  calculateDistanceKm,
  calculateSendFare
} from '../data/mockLocations';
import { realtimeStore } from '../services/realtimeStore';

interface CustomerSendProps {
  customerLocation?: LocationPoint;
  activeOrder?: OrderData | null;
  onBackToHome?: () => void;
  onOrderCreated?: (orderId: string) => void;
}

const PACKAGE_CATEGORIES: {
  id: PackageItemDetail['category'];
  label: string;
  icon: string;
  desc: string;
}[] = [
  { id: 'DOKUMEN', label: 'Dokumen & Surat', icon: '📄', desc: 'Surat, map, akta, paspor, berkas' },
  { id: 'MAKANAN', label: 'Makanan & Minuman', icon: '🍱', desc: 'Kue, bekal, tumpeng, minuman' },
  { id: 'PAKAIAN', label: 'Pakaian & Tekstil', icon: '👕', desc: 'Baju, kain, jaket, sepatu' },
  { id: 'ELEKTRONIK', label: 'Elektronik & Gadget', icon: '📱', desc: 'HP, laptop, aksesori, charger' },
  { id: 'PECAH_BELAH', label: 'Barang Pecah Belah', icon: '🏺', desc: 'Gelas, piring, botol kaca, vas' },
  { id: 'LAINNYA', label: 'Lainnya / Umum', icon: '📦', desc: 'Kebutuhan harian, kado, paket' }
];

const WEIGHT_OPTIONS = [
  { weight: 1, label: '< 1 kg', desc: 'Dokumen / amplop' },
  { weight: 2, label: '1 - 2 kg', desc: 'Paket standar' },
  { weight: 5, label: '3 - 5 kg', desc: 'Kardus sedang' },
  { weight: 10, label: '6 - 10 kg', desc: 'Kardus besar' },
  { weight: 15, label: '11 - 20 kg', desc: 'Maks. Motor' }
];

const SIZE_OPTIONS: {
  size: PackageItemDetail['sizeCategory'];
  title: string;
  dimensions: string;
  desc: string;
}[] = [
  { size: 'KECIL', title: 'Kecil', dimensions: 'Maks. 20 x 20 x 10 cm', desc: 'Pouch, dokumen, obat, aksesoris kecil' },
  { size: 'SEDANG', title: 'Sedang', dimensions: 'Maks. 40 x 30 x 20 cm', desc: 'Kardus sepatu, kotak makanan, tas' },
  { size: 'BESAR', title: 'Besar', dimensions: 'Maks. 50 x 45 x 40 cm', desc: 'Kardus box besar (kapasitas jok motor)' }
];

const SPECIAL_HANDLING_OPTIONS = [
  { id: 'FRAGILE', label: 'Pecah Belah (Fragile)', icon: '⚠️' },
  { id: 'KEEP_UPRIGHT', label: 'Harus Tegak / Jangan Miring', icon: '⬆️' },
  { id: 'WATERPROOF', label: 'Lindungi dari Hujan / Basah', icon: '💧' },
  { id: 'URGENT', label: 'Prioritas / Makanan Hangat', icon: '⚡' }
];

export const CustomerSend: React.FC<CustomerSendProps> = ({
  customerLocation,
  activeOrder,
  onBackToHome,
  onOrderCreated
}) => {
  // --- STATE ALUR FORM INPUT PELANGGAN ---
  // 1. Lokasi & Titik Kontak
  const [origin, setOrigin] = useState<LocationPoint>(customerLocation || JAKARTA_LOCATIONS[0]);
  const [destination, setDestination] = useState<LocationPoint>(JAKARTA_LOCATIONS[2]);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  // Informasi Pengirim
  const [senderName, setSenderName] = useState(INITIAL_CUSTOMER.name);
  const [senderPhone, setSenderPhone] = useState(INITIAL_CUSTOMER.phone);
  const [senderNotes, setSenderNotes] = useState('Pagar hitam nomor 12, klakson depan pintu.');

  // Informasi Penerima
  const [recipientName, setRecipientName] = useState('Dewi Anggraini');
  const [recipientPhone, setRecipientPhone] = useState('0813-7766-5544');
  const [recipientAddressNotes, setRecipientAddressNotes] = useState('Lantai 4 Ruang 402, titip resepsionis lobi depan jika tidak di tempat.');

  // 2. Detail Barang
  const [itemName, setItemName] = useState('Dokumen Kontrak & Sample Kain');
  const [category, setCategory] = useState<PackageItemDetail['category']>('DOKUMEN');
  const [weightKg, setWeightKg] = useState<number>(2);
  const [sizeCategory, setSizeCategory] = useState<PackageItemDetail['sizeCategory']>('SEDANG');
  const [selectedSpecialHandling, setSelectedSpecialHandling] = useState<string[]>(['WATERPROOF']);

  // OjekPay Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number>(() => realtimeStore.getCustomerWallet());
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = realtimeStore.subscribe(() => {
      setWalletBalance(realtimeStore.getCustomerWallet());
    });
    return () => unsub();
  }, []);
  const [packageSpecialNotes, setPackageSpecialNotes] = useState('Tolong jangan dilipat dan pastikan terlindung saat hujan.');
  const [packagePhotoUrl, setPackagePhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=80'
  );

  // 3. Perhitungan Tarif & Proteksi
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [applyPromo, setApplyPromo] = useState(true);

  // 4. Pembayaran
  const [payerType, setPayerType] = useState<'SENDER' | 'RECIPIENT'>('SENDER');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER'>('DIGITAL_WALLET');

  // Step Navigasi Tab di dalam Paket Kilat
  const [activeStep, setActiveStep] = useState<'FORM' | 'REVIEW'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Perhitungan Tarif Otomatis berdasarkan Jarak & Berat
  const distanceKm = useMemo(() => {
    return calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  }, [origin, destination]);

  const fareBreakdown: SendFareBreakdown = useMemo(() => {
    return calculateSendFare(distanceKm, weightKg, includeInsurance, applyPromo);
  }, [distanceKm, weightKg, includeInsurance, applyPromo]);

  // Toggle Special Handling Checkbox
  const toggleHandling = (id: string) => {
    if (selectedSpecialHandling.includes(id)) {
      setSelectedSpecialHandling(selectedSpecialHandling.filter((item) => item !== id));
    } else {
      setSelectedSpecialHandling([...selectedSpecialHandling, id]);
    }
  };

  // Submit Buat Pesanan Paket Kilat
  const handleCreateSendOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (paymentMethod === 'DIGITAL_WALLET' && walletBalance < fareBreakdown.totalFare) {
      setShowTopUpModal(true);
      return;
    }

    setIsSubmitting(true);

    const packageItem: PackageItemDetail = {
      itemName: itemName.trim() || 'Paket Kiriman Kilat',
      category,
      weightKg,
      sizeCategory,
      specialHandling: selectedSpecialHandling,
      specialNotes: packageSpecialNotes,
      photoUrl: packagePhotoUrl
    };

    const senderContact: ContactPerson = {
      name: senderName,
      phone: senderPhone,
      addressNote: senderNotes
    };

    const recipientContact: ContactPerson = {
      name: recipientName,
      phone: recipientPhone,
      addressNote: recipientAddressNotes
    };

    setTimeout(() => {
      const orderId = realtimeStore.createSendOrder({
        origin,
        destination,
        senderContact,
        recipientContact,
        packageItem,
        sendFareBreakdown: fareBreakdown,
        paymentMethod,
        payerType
      });

      setIsSubmitting(false);
      if (onOrderCreated) {
        onOrderCreated(orderId);
      }
    }, 450);
  };

  // Copy OTP Helper
  const handleCopyOtp = (code: string, type: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedOtp(type);
    setTimeout(() => setCopiedOtp(null), 2500);
  };

  // Switch Origin / Destination
  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Bar Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200/80 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
                <Package className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-black text-slate-900">Paket Kilat (Ojek Send)</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black tracking-wider uppercase border border-orange-200">
                SAMEDAY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Kirim barang langsung dijemput & diantar hari ini dengan keamanan OTP
            </p>
          </div>
        </div>
      </div>

      {/* JIKA ADA PESANAN PAKET KILAT AKTIF: TAMPILKAN STATUS REALTIME TRACKING & OTP */}
      {activeOrder && activeOrder.serviceType === 'SEND' && (
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Banner Status */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider">
                  {activeOrder.status === 'SEARCHING' && 'Mencari Kurir Terdekat...'}
                  {activeOrder.status === 'ACCEPTED' && activeOrder.tripStep === 'HEADING_TO_PICKUP' && 'Kurir Menuju Lokasi Pengirim'}
                  {activeOrder.status === 'ACCEPTED' && activeOrder.tripStep === 'ARRIVED_AT_PICKUP' && 'Kurir Tiba di Lokasi Pengirim'}
                  {activeOrder.status === 'ON_TRIP' && activeOrder.tripStep === 'ON_THE_WAY' && 'Paket Sedang Diantar ke Penerima'}
                  {activeOrder.tripStep === 'ARRIVED_AT_DESTINATION' && 'Kurir Tiba di Lokasi Penerima'}
                  {activeOrder.status === 'COMPLETED' && 'Pengiriman Selesai! Paket Terkirim'}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs font-bold">
                {activeOrder.orderId}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-orange-100 block font-semibold">Barang yang Dikirim</span>
                <span className="font-extrabold text-sm">{activeOrder.packageItem?.itemName || activeOrder.packageType}</span>
                <span className="text-[11px] text-orange-100 block">
                  {activeOrder.packageItem?.weightKg || 2} kg • Ukuran {activeOrder.packageItem?.sizeCategory || 'SEDANG'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-orange-100 block font-semibold">Total Tarif</span>
                <span className="font-black text-base font-mono">Rp {activeOrder.totalFare.toLocaleString('id-ID')}</span>
                <span className="text-[10px] text-emerald-200 block font-bold">
                  {activeOrder.paymentMethod === 'CASH' ? 'Bayar Tunai' : 'Lunas Saldo/Online'}
                </span>
              </div>
            </div>

            {/* SISTEM KEAMANAN OTP PELANGGAN */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* OTP Penjemputan */}
              <div className="bg-white text-slate-900 p-3 rounded-2xl border border-orange-200 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    <span>OTP Jemput Barang</span>
                  </span>
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded font-black">
                    PENGIRIM
                  </span>
                </div>
                <div className="text-center my-1">
                  <span className="text-xl font-black font-mono tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200 inline-block">
                    {activeOrder.pickupOtp || '4829'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 text-center leading-tight">
                  Berikan 4 angka ini ke kurir saat barang diambil.
                </p>
                <button
                  onClick={() => handleCopyOtp(activeOrder.pickupOtp || '4829', 'pickup')}
                  className="w-full mt-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
                >
                  {copiedOtp === 'pickup' ? '✓ Tersalin!' : 'Salin OTP'}
                </button>
              </div>

              {/* OTP Penerimaan */}
              <div className="bg-white text-slate-900 p-3 rounded-2xl border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OTP Penerima</span>
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-black">
                    PENERIMA
                  </span>
                </div>
                <div className="text-center my-1">
                  <span className="text-xl font-black font-mono tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-block">
                    {activeOrder.deliveryOtp || '7193'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 text-center leading-tight">
                  Berikan ke kurir saat paket tiba di tujuan.
                </p>
                <button
                  onClick={() => handleCopyOtp(activeOrder.deliveryOtp || '7193', 'delivery')}
                  className="w-full mt-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors border border-emerald-200"
                >
                  {copiedOtp === 'delivery' ? '✓ Tersalin!' : 'Salin OTP'}
                </button>
              </div>
            </div>
          </div>

          {/* Bukti Verifikasi Foto Pengambilan & Penerimaan */}
          {(activeOrder.packagePickupProof || activeOrder.packageDeliveryProof) && (
            <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                <span>Bukti Verifikasi Serah Terima Kurir</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bukti Ambil Paket */}
                {activeOrder.packagePickupProof && (
                  <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-orange-900">Bukti Ambil dari Pengirim</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        ✓ Terverifikasi
                      </span>
                    </div>
                    {activeOrder.packagePickupProof.photoUrl && (
                      <img
                        src={activeOrder.packagePickupProof.photoUrl}
                        alt="Bukti Pengambilan"
                        className="w-full h-32 rounded-xl object-cover border border-orange-200"
                      />
                    )}
                    <p className="text-[11px] text-slate-700 font-medium">
                      <span className="font-bold">Kondisi:</span> {activeOrder.packagePickupProof.notes}
                    </p>
                  </div>
                )}

                {/* Bukti Terima Paket */}
                {activeOrder.packageDeliveryProof && (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-900">Bukti Diterima di Tujuan</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        ✓ Diterima
                      </span>
                    </div>
                    {activeOrder.packageDeliveryProof.photoUrl && (
                      <img
                        src={activeOrder.packageDeliveryProof.photoUrl}
                        alt="Bukti Penerimaan"
                        className="w-full h-32 rounded-xl object-cover border border-emerald-200"
                      />
                    )}
                    <p className="text-[11px] text-slate-700 font-medium">
                      <span className="font-bold">Diterima Oleh:</span> {activeOrder.packageDeliveryProof.receivedBy} ({activeOrder.packageDeliveryProof.relationship})
                    </p>
                    {activeOrder.packageDeliveryProof.notes && (
                      <p className="text-[10px] text-slate-500">
                        Catatan: {activeOrder.packageDeliveryProof.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Driver yang Bertugas */}
          {activeOrder.driverName && (
            <div className="p-4 bg-white rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-orange-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    Kurir Paket Kilat Anda
                  </span>
                  <h4 className="text-xs font-black text-slate-900">{activeOrder.driverName}</h4>
                  <p className="text-[11px] text-slate-500">
                    {activeOrder.driverVehicle || 'Honda Vario'} • <span className="font-mono font-bold text-slate-700">{activeOrder.driverPlate}</span>
                  </p>
                </div>
              </div>
              <a
                href={`tel:${activeOrder.driverPhone || '085711223344'}`}
                className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-xs"
                title="Hubungi Kurir"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* JIKA TIDAK ADA ACTIVE ORDER: FORM LENGKAP PENDAFTARAN PAKET KILAT */}
      {(!activeOrder || activeOrder.serviceType !== 'SEND' || activeOrder.status === 'COMPLETED') && (
        <form onSubmit={handleCreateSendOrder} className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* STEP 1: LOKASI PENJEMPUTAN (PENGIRIM) & LOKASI PENGANTARAN (PENERIMA) */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">1. Alamat Pengirim & Penerima</h3>
                  <span className="text-[10px] text-slate-500">Tentukan titik jemput dan titik antar barang</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSwapLocations}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200 transition-colors"
              >
                ⇄ Tukar Rute
              </button>
            </div>

            {/* Titik Pengirim (Jemput) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                  <span>Titik Penjemputan Paket (Pengirim)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowOriginPicker(!showOriginPicker)}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  {showOriginPicker ? 'Tutup Pilihan' : 'Ubah Lokasi'}
                </button>
              </div>
              <div className="text-xs font-bold text-slate-900">{origin.name}</div>
              <div className="text-[11px] text-slate-500">{origin.address}</div>

              {/* Form Nama & Nomor Pengirim */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama Pengirim:</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Nama Pengirim"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">No. HP Pengirim:</label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>
              </div>

              {/* Catatan Patokan Penjemputan */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Patokan / Instruksi Penjemputan:
                </label>
                <input
                  type="text"
                  value={senderNotes}
                  onChange={(e) => setSenderNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Cth: Pagar abu-abu, klakson depan pintu garasi"
                />
              </div>

              {/* Selector List Origin */}
              {showOriginPicker && (
                <div className="mt-2 p-2 bg-white rounded-xl border border-emerald-300 space-y-1 max-h-36 overflow-y-auto">
                  {JAKARTA_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        setOrigin(loc);
                        setShowOriginPicker(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-emerald-50 flex flex-col transition-colors"
                    >
                      <span className="font-bold text-slate-900">{loc.name}</span>
                      <span className="text-[10px] text-slate-500 truncate">{loc.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Titik Penerima (Tujuan) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-700 font-extrabold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
                  <span>Titik Pengantaran Paket (Penerima)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowDestPicker(!showDestPicker)}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  {showDestPicker ? 'Tutup Pilihan' : 'Ubah Lokasi'}
                </button>
              </div>
              <div className="text-xs font-bold text-slate-900">{destination.name}</div>
              <div className="text-[11px] text-slate-500">{destination.address}</div>

              {/* Form Nama & Nomor Penerima */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama Penerima:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="Nama Penerima"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">No. HP Penerima:</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="0813-xxxx-xxxx"
                  />
                </div>
              </div>

              {/* Catatan Patokan Pengantaran */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Patokan Alamat / Instruksi Antar Penerima:
                </label>
                <input
                  type="text"
                  value={recipientAddressNotes}
                  onChange={(e) => setRecipientAddressNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="Cth: Lantai 3, titip resepsionis lobi depan"
                />
              </div>

              {/* Selector List Destination */}
              {showDestPicker && (
                <div className="mt-2 p-2 bg-white rounded-xl border border-rose-300 space-y-1 max-h-36 overflow-y-auto">
                  {JAKARTA_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        setDestination(loc);
                        setShowDestPicker(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-rose-50 flex flex-col transition-colors"
                    >
                      <span className="font-bold text-slate-900">{loc.name}</span>
                      <span className="text-[10px] text-slate-500 truncate">{loc.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: DETAIL BARANG YANG DIKIRIM */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">2. Detail Barang & Karakteristik Paket</h3>
                  <span className="text-[10px] text-slate-500">Pilih jenis, estimasi berat, dan ukuran barang</span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                WAJIB
              </span>
            </div>

            {/* Nama Barang Input */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                Nama Barang / Deskripsi Paket:
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder="Contoh: Dokumen Kontrak, Kue Ulang Tahun, Baju Batik..."
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Kategori Barang */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1.5">
                Kategori Barang:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PACKAGE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30 text-orange-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs block font-bold leading-tight">{cat.label}</span>
                        <span className="text-[9px] text-slate-400 block line-clamp-1">{cat.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bobot Berat Paket (Kg) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-orange-600" />
                  <span>Estimasi Berat Barang:</span>
                </label>
                <span className="text-xs font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  {weightKg} kg {weightKg > 2 ? `(+Rp ${((weightKg - 2) * 2000).toLocaleString('id-ID')})` : '(Gratis Bobot)'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {WEIGHT_OPTIONS.map((opt) => (
                  <button
                    key={opt.weight}
                    type="button"
                    onClick={() => setWeightKg(opt.weight)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      weightKg === opt.weight
                        ? 'bg-orange-600 text-white border-orange-600 font-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold'
                    }`}
                  >
                    <span className="text-xs block font-mono">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran Dimensi Paket */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1.5">
                Dimensi Ukuran Paket:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_OPTIONS.map((sizeOpt) => {
                  const isSelected = sizeCategory === sizeOpt.size;
                  return (
                    <button
                      key={sizeOpt.size}
                      type="button"
                      onClick={() => setSizeCategory(sizeOpt.size)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30 text-orange-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block font-black">{sizeOpt.title}</span>
                      <span className="text-[9px] text-orange-600 font-mono block mt-0.5">{sizeOpt.dimensions}</span>
                      <span className="text-[8px] text-slate-400 block mt-1 leading-tight">{sizeOpt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruksi Khusus Penanganan Barang */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1.5">
                Instruksi Khusus Penanganan (Bisa Pilih Lebih dari 1):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIAL_HANDLING_OPTIONS.map((opt) => {
                  const isChecked = selectedSpecialHandling.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleHandling(opt.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isChecked
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className="text-[11px] leading-tight">{opt.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-700 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catatan Tambahan untuk Kurir */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">
                Catatan / Pesan Khusus untuk Kurir:
              </label>
              <input
                type="text"
                value={packageSpecialNotes}
                onChange={(e) => setPackageSpecialNotes(e.target.value)}
                placeholder="Cth: Jangan ditindih barang berat, hubungi penerima sebelum sampai..."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* STEP 3: PERHITUNGAN TARIF & ASURANSI PROTEKSI */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">3. Rincian Tarif & Proteksi Paket</h3>
                  <span className="text-[10px] text-slate-500">Kalkulasi transparan jarak tempuh & garansi</span>
                </div>
              </div>
              <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {distanceKm} km
              </span>
            </div>

            {/* Proteksi Asuransi Toggle */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-emerald-950">Proteksi Kehilangan / Kerusakan</h4>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-black font-mono">
                      +Rp 1.500
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Kompensasi penggantian s.d Rp 5.000.000 jika paket rusak atau hilang
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeInsurance}
                onChange={(e) => setIncludeInsurance(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Rincian Komponen Biaya */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Tarif Dasar Paket (0 - 2 km):</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {fareBreakdown.baseFare.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Jarak Tambahan ({Math.max(0, Number((distanceKm - 2).toFixed(1)))} km):</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {fareBreakdown.distanceFare.toLocaleString('id-ID')}
                </span>
              </div>
              {fareBreakdown.weightSurcharge > 0 && (
                <div className="flex justify-between text-orange-700">
                  <span>Tambahan Berat ({weightKg} kg):</span>
                  <span className="font-mono font-semibold">
                    +Rp {fareBreakdown.weightSurcharge.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {includeInsurance && (
                <div className="flex justify-between text-emerald-700">
                  <span>Asuransi Proteksi Kilat:</span>
                  <span className="font-mono font-semibold">
                    +Rp {fareBreakdown.insuranceFee.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Biaya Layanan Aplikasi:</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {fareBreakdown.appFee.toLocaleString('id-ID')}
                </span>
              </div>
              {fareBreakdown.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Voucher Diskon Sameday:</span>
                  <span className="font-mono">-Rp {fareBreakdown.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Total Fare Card */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  Total Ongkos Kirim:
                </span>
                <span className="text-xl font-black text-orange-600 font-mono">
                  Rp {fareBreakdown.totalFare.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                Hemat Rp {fareBreakdown.discount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* STEP 4: PEMILIHAN PEMBAYARAN */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">4. Pihak Pembayar & Metode Pembayaran</h3>
                  <span className="text-[10px] text-slate-500">Pilih siapa yang menanggung ongkir dan kanal bayar</span>
                </div>
              </div>
            </div>

            {/* Siapa yang Membayar Ongkir */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1.5">
                Siapa yang Membayar Ongkir Paket?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayerType('SENDER')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    payerType === 'SENDER'
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30 text-orange-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs block">Pengirim (Bayar di Awal)</span>
                  <span className="text-[9px] text-slate-400 block font-normal">Dibayar saat kurir menjemput barang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayerType('RECIPIENT')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    payerType === 'RECIPIENT'
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/30 text-orange-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs block">Penerima (COD Ongkir)</span>
                  <span className="text-[9px] text-slate-400 block font-normal">Dibayar oleh penerima saat paket tiba</span>
                </button>
              </div>
            </div>

            {/* Kanal Metode Pembayaran */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1.5">
                Kanal Pembayaran:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Saldo OjekPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('DIGITAL_WALLET')}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative ${
                    paymentMethod === 'DIGITAL_WALLET'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 text-emerald-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>Saldo OjekPay</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowTopUpModal(true);
                      }}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      + Top Up
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-mono text-slate-700 block">
                      Saldo: <strong>Rp {walletBalance.toLocaleString('id-ID')}</strong>
                    </span>
                    {walletBalance >= fareBreakdown.totalFare ? (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Cukup</span>
                    ) : (
                      <span className="text-[8px] bg-rose-100 text-rose-800 font-bold px-1 rounded">Kurang</span>
                    )}
                  </div>
                  <span className="text-[9px] text-emerald-700 block font-bold mt-0.5">✓ Potong Otomatis</span>
                </button>

                {/* 2. QRIS Instan */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/30 text-blue-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-700">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>QRIS Instan</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">BCA, GoPay, OVO, Shopee</span>
                  <span className="text-[9px] text-blue-700 block font-bold">✓ Scan Langsung</span>
                </button>

                {/* 3. Tunai / Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 text-amber-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Uang Tunai (Cash)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {payerType === 'SENDER' ? 'Bayar ke Kurir saat Jemput' : 'Bayar ke Kurir saat Antar'}
                  </span>
                  <span className="text-[9px] text-amber-700 block font-bold">✓ Uang Pas</span>
                </button>

                {/* 4. Transfer Virtual Account */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/30 text-purple-950 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-purple-700">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Virtual Account Bank</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">BCA, Mandiri, BRI, BNI</span>
                  <span className="text-[9px] text-purple-700 block font-bold">✓ Verifikasi Otomatis</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isSubmitting || !itemName.trim()}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] text-white font-black text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Memproses Pesanan Paket Kilat...</span>
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 text-white" />
                  <span>Pesan Kurir Paket Kilat Sekarang (Rp {fareBreakdown.totalFare.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Kurir terdekat akan dialokasikan seketika dengan sistem verifikasi kode OTP aman.
            </p>
          </div>
        </form>
      )}

      {/* Modal Top Up OjekPay */}
      <CustomerTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </div>
  );
};
