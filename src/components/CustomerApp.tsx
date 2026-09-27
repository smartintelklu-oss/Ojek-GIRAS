import React, { useState, useMemo, useEffect } from 'react';
import {
  LocationPoint,
  OrderData,
  DriverLocation,
  OrderStatus,
  MerchantProfile,
  MenuItem,
  OrderItemDetail
} from '../types';
import {
  JAKARTA_LOCATIONS,
  INITIAL_CUSTOMER,
  INITIAL_MERCHANT,
  calculateDistanceKm,
  calculateFare
} from '../data/mockLocations';
import { InteractiveMap } from './InteractiveMap';
import { CustomerHome } from './CustomerHome';
import { CustomerOrders } from './CustomerOrders';
import { CustomerProfile } from './CustomerProfile';
import { CustomerShopping } from './CustomerShopping';
import { CustomerFood } from './CustomerFood';
import { CustomerSend } from './CustomerSend';
import { CustomerCar } from './CustomerCar';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import { realtimeStore } from '../services/realtimeStore';
import {
  MapPin,
  Navigation,
  Clock,
  Banknote,
  ShieldCheck,
  Phone,
  MessageSquare,
  Star,
  Wallet,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Home,
  Bike,
  Car,
  Package,
  Box,
  Tag,
  ClipboardList,
  User,
  ArrowLeft,
  Signal,
  Wifi,
  Battery,
  Utensils,
  Store,
  Plus,
  Minus,
  ShoppingBag,
  PackageCheck
} from 'lucide-react';

export const PACKAGE_PRESETS = [
  { id: 'dokumen', label: 'Dokumen / Surat', icon: '📄' },
  { id: 'pakaian', label: 'Pakaian & Tekstil', icon: '👕' },
  { id: 'makanan', label: 'Makanan & Minuman', icon: '🍔' },
  { id: 'elektronik', label: 'Elektronik & Gadget', icon: '📱' },
  { id: 'pecah_belah', label: 'Pecah Belah (Fragile)', icon: '🏺' },
  { id: 'kotak_dus', label: 'Kotak Dus / Parcel', icon: '📦' },
  { id: 'obat', label: 'Obat & Medis', icon: '💊' },
  { id: 'lainnya', label: 'Lainnya / Umum', icon: '🏷️' }
];

interface CustomerAppProps {
  currentOrder: OrderData | null;
  driverLocation?: DriverLocation;
  merchant?: MerchantProfile;
  merchants?: Record<string, MerchantProfile>;
  onCreateOrder: (
    origin: LocationPoint,
    destination: LocationPoint,
    options?: {
      serviceType?: string;
      packageType?: string;
      packageNotes?: string;
      merchantId?: string;
      merchantName?: string;
      items?: OrderItemDetail[];
      foodSubtotal?: number;
      merchantNotes?: string;
      paymentMethod?: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER';
    }
  ) => void;
  onCancelOrder: (orderId: string) => void;
  onReset: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  currentOrder,
  driverLocation,
  merchant,
  merchants,
  onCreateOrder,
  onCancelOrder,
  onReset
}) => {
  // Navigation Tabs: 'home' | 'ride' | 'car' | 'send' | 'food' | 'shopping' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'ride' | 'car' | 'send' | 'food' | 'shopping' | 'orders' | 'profile'>('home');

  // Confirmation Received Modal state
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReceived, setIsSubmittingReceived] = useState(false);

  const activeMerchant = merchant || INITIAL_MERCHANT;

  // Service selection in booking screen: 'RIDE' | 'CAR' | 'SEND' | 'FOOD'
  const [selectedService, setSelectedService] = useState<'RIDE' | 'CAR' | 'SEND' | 'FOOD'>('RIDE');
  const [packageType, setPackageType] = useState<string>('Dokumen / Surat');
  const [packageNotes, setPackageNotes] = useState<string>('');

  // Cart for Ojek Food
  const [cart, setCart] = useState<Record<string, number>>({
    m1: 1
  });
  const [foodNotes, setFoodNotes] = useState<string>('Sambal pedas dipisah, jangan terlalu pedas');

  const foodSubtotal = useMemo(() => {
    return Object.entries(cart).reduce<number>((sum, [itemId, qty]) => {
      const item = activeMerchant.menuItems.find((m) => m.id === itemId);
      return sum + (item ? item.price * (Number(qty) || 0) : 0);
    }, 0);
  }, [cart, activeMerchant]);

  const totalFoodItemsCount = useMemo(() => {
    return Object.values(cart).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);
  }, [cart]);

  // Local state for selecting locations in Ride screen
  const [origin, setOrigin] = useState<LocationPoint>(JAKARTA_LOCATIONS[0]); // Stasiun Gambir
  const [destination, setDestination] = useState<LocationPoint>(JAKARTA_LOCATIONS[2]); // Grand Indonesia
  const [searchQuery, setSearchQuery] = useState<{ field: 'origin' | 'destination' | null; text: string }>({
    field: null,
    text: ''
  });

  // Saldo Dompet Digital OjekPay & Metode Pembayaran
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(() => realtimeStore.getCustomerWallet());
  const [ridePaymentMethod, setRidePaymentMethod] = useState<'DIGITAL_WALLET' | 'CASH'>('DIGITAL_WALLET');

  useEffect(() => {
    const unsub = realtimeStore.subscribe(() => {
      setWalletBalance(realtimeStore.getCustomerWallet());
    });
    return () => unsub();
  }, []);

  // If order becomes active, auto-switch to 'send' (for SEND) or 'car' (for CAR) or 'ride' tab so user sees the live map & status
  useEffect(() => {
    if (currentOrder && (currentOrder.status === 'SEARCHING' || currentOrder.status === 'ACCEPTED' || currentOrder.status === 'ON_TRIP')) {
      if (currentOrder.serviceType === 'SEND') {
        setActiveTab('send');
      } else if (currentOrder.serviceType === 'CAR') {
        setActiveTab('car');
      } else {
        setActiveTab('ride');
      }
    }
  }, [currentOrder?.status, currentOrder?.serviceType]);

  // Calculate preview distance and fare
  const previewDistance = useMemo(() => {
    return calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  }, [origin, destination]);

  const previewFare = useMemo(() => {
    return calculateFare(previewDistance);
  }, [previewDistance]);

  const handleSelectLocation = (loc: LocationPoint) => {
    if (searchQuery.field === 'origin') {
      setOrigin(loc);
    } else if (searchQuery.field === 'destination') {
      setDestination(loc);
    }
    setSearchQuery({ field: null, text: '' });
  };

  const handleConfirmReceived = async () => {
    if (!currentOrder) return;
    setIsSubmittingReceived(true);
    await realtimeStore.confirmOrderReceived(
      currentOrder.orderId,
      ratingScore,
      reviewComment || 'Barang lengkap, packing rapi, dan kurir sangat ramah!'
    );
    setIsSubmittingReceived(false);
    setShowReceivedModal(false);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalOrderAmount = selectedService === 'FOOD' ? foodSubtotal + previewFare.totalFare : previewFare.totalFare;
    if (ridePaymentMethod === 'DIGITAL_WALLET') {
      if (walletBalance < totalOrderAmount) {
        setIsTopUpModalOpen(true);
        return;
      }
    }

    if (selectedService === 'FOOD') {
      if (totalFoodItemsCount === 0) {
        alert('Silakan pilih minimal 1 menu makanan terlebih dahulu');
        return;
      }
      const orderItems: OrderItemDetail[] = Object.entries(cart)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([itemId, qty]) => {
          const mItem = activeMerchant.menuItems.find((m) => m.id === itemId);
          return {
            menuId: itemId,
            name: mItem ? mItem.name : 'Menu Resto',
            price: mItem ? mItem.price : 0,
            quantity: Number(qty),
            notes: foodNotes
          };
        });

      onCreateOrder(activeMerchant.location, destination, {
        serviceType: 'FOOD',
        merchantId: activeMerchant.merchantId,
        merchantName: activeMerchant.storeName,
        items: orderItems,
        foodSubtotal,
        merchantNotes: foodNotes,
        paymentMethod: ridePaymentMethod
      });
      return;
    }

    if (origin.name === destination.name) {
      alert('Lokasi penjemputan dan tujuan tidak boleh sama');
      return;
    }
    if (selectedService === 'SEND' && !packageType.trim()) {
      alert('Silakan tentukan jenis paket barang yang dikirim');
      return;
    }
    onCreateOrder(origin, destination, {
      serviceType: selectedService,
      packageType: selectedService === 'SEND' ? packageType.trim() : undefined,
      packageNotes: selectedService === 'SEND' ? packageNotes.trim() : undefined,
      paymentMethod: ridePaymentMethod
    });
  };

  const isOrderActive = currentOrder && (
    currentOrder.status === 'SEARCHING' ||
    currentOrder.status === 'ACCEPTED' ||
    currentOrder.status === 'ON_TRIP'
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl relative select-none">
      
      {/* 1. Mobile Phone Status Bar (Clean Light Theme) */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200/90 shrink-0 z-20">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-emerald-600 font-extrabold tracking-tight">OjekKilat</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
            {activeTab === 'home'
              ? 'BERANDA'
              : activeTab === 'car'
              ? 'OJEK CAR'
              : activeTab === 'send'
              ? 'PAKET KILAT'
              : activeTab === 'food'
              ? 'OJEK FOOD'
              : activeTab === 'shopping'
              ? 'BELANJA'
              : activeTab === 'ride'
              ? 'PETA OJEK'
              : activeTab === 'orders'
              ? 'AKTIVITAS'
              : 'AKUN'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
          <button
            type="button"
            onClick={() => setIsTopUpModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-black text-emerald-800 transition-colors shadow-xs cursor-pointer"
            title="Isi Saldo OjekPay"
          >
            <Wallet className="w-3 h-3 text-emerald-600" />
            <span className="font-mono font-bold">Rp {walletBalance.toLocaleString('id-ID')}</span>
            <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-full font-bold">+</span>
          </button>
          <span>4G</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>100%</span>
        </div>
      </div>

      {/* 2. BODY CONTENT BERDASARKAN TAB AKTIF */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50">
        
        {/* TAB 1: BERANDA (HOME & MENU LAYANAN) */}
        {activeTab === 'home' && (
          <CustomerHome
            currentOrder={currentOrder}
            onOpenTopUp={() => setIsTopUpModalOpen(true)}
            onOpenRideBooking={(presetDest, servicePreset) => {
              if (presetDest) setDestination(presetDest);
              if (servicePreset === 'SEND') {
                setActiveTab('send');
              } else if (servicePreset === 'CAR') {
                setActiveTab('car');
              } else if (servicePreset === 'FOOD') {
                setActiveTab('food');
              } else {
                setSelectedService('RIDE');
                setActiveTab('ride');
              }
            }}
            onOpenCar={() => setActiveTab('car')}
            onOpenSend={() => setActiveTab('send')}
            onOpenFood={() => setActiveTab('food')}
            onOpenActivity={() => setActiveTab('orders')}
            onOpenShopping={() => setActiveTab('shopping')}
          />
        )}

        {/* TAB OJEK CAR: GPS PICKUP, LOBI DROPOFF, ESTIMASI RUTE TOL, TIER MOBIL, TARIF & PEMBAYARAN */}
        {activeTab === 'car' && (
          <CustomerCar
            customerLocation={origin}
            activeOrder={currentOrder?.serviceType === 'CAR' ? currentOrder : null}
            driverLocation={driverLocation}
            onBackToHome={() => setActiveTab('home')}
            onOrderCreated={(orderId) => {
              setActiveTab('car');
            }}
          />
        )}

        {/* TAB PAKET KILAT: INPUT LOKASI, DETAIL BARANG, INFO PENERIMA, TARIF, PEMBAYARAN, OTP & TRACKING */}
        {activeTab === 'send' && (
          <CustomerSend
            customerLocation={origin}
            activeOrder={currentOrder?.serviceType === 'SEND' ? currentOrder : null}
            onBackToHome={() => setActiveTab('home')}
            onOrderCreated={(orderId) => {
              setActiveTab('send');
            }}
          />
        )}

        {/* TAB OJEK FOOD: PILIH RESTO, MENU, KERANJANG, PENINJAUAN & CHECKOUT */}
        {activeTab === 'food' && (
          <CustomerFood
            merchants={merchants}
            currentOrder={currentOrder}
            onBackToHome={() => setActiveTab('home')}
            onViewActiveOrder={() => setActiveTab('ride')}
          />
        )}

        {/* TAB BELANJA: KATALOG TOKO MITRA & CHECKOUT */}
        {activeTab === 'shopping' && (
          <CustomerShopping
            merchants={merchants}
            customerLocation={origin}
            onBackToHome={() => setActiveTab('home')}
            onOrderCreated={(orderId) => {
              setActiveTab('ride');
            }}
          />
        )}

        {/* TAB 2: PESAN OJEK (INTERACTIVE MAP & BOOKING FLOW) */}
        {activeTab === 'ride' && (
          <div className="flex-1 flex flex-col overflow-hidden pb-16 bg-slate-50">
            
            {/* Map Header with Return to Home Button */}
            <div className="relative h-60 sm:h-64 w-full shrink-0 border-b border-slate-200">
              <InteractiveMap
                origin={currentOrder ? currentOrder.origin : origin}
                destination={currentOrder ? currentOrder.destination : destination}
                driverLocation={driverLocation}
                tripStep={currentOrder?.tripStep}
              />

              {/* Floating Return to Home Button */}
              <button
                onClick={() => setActiveTab('home')}
                className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs text-slate-700 font-bold hover:text-emerald-700 hover:bg-white transition-all z-10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>

              {/* Floating Customer Avatar Pill */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full shadow-md flex items-center gap-2 z-10">
                <img
                  src={INITIAL_CUSTOMER.avatar}
                  alt={INITIAL_CUSTOMER.name}
                  className="w-5 h-5 rounded-full object-cover border border-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">{INITIAL_CUSTOMER.name.split(' ')[0]}</span>
              </div>
            </div>

            {/* Scrollable Booking / Tracking Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              
              {/* VIEW 1: IDLE / BOOKING FORM */}
              {(!currentOrder || currentOrder.status === 'CANCELLED') && (
                <form onSubmit={handleOrderSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Pesan Ojek Ride</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Motor Hemat
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Tentukan titik penjemputan dan tujuan perjalanan motor Anda</p>
                    </div>
                  </div>

                  {/* KHUSUS PAKET KILAT: INPUT JENIS PAKET BARANG YANG DIKIRIM */}
                  {selectedService === 'SEND' && (
                    <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/40 border-2 border-orange-400/80 rounded-2xl space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-xs">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-900 block tracking-tight">
                              Jenis Paket Barang Yang Dikirim
                            </label>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Pilih kategori cepat atau ketik nama barang
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 font-mono">
                          WAJIB DIISI
                        </span>
                      </div>

                      {/* Quick Category Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                          Kategori Pilihan Cepat:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PACKAGE_PRESETS.map((preset) => {
                            const isChosen = packageType === preset.label;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setPackageType(preset.label)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                                  isChosen
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs scale-[1.02] ring-1 ring-orange-400'
                                    : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/60'
                                }`}
                              >
                                <span>{preset.icon}</span>
                                <span>{preset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Input Text Box for Package Item Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          Rincian Nama / Jenis Barang:
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500">
                            <Package className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={packageType}
                            onChange={(e) => setPackageType(e.target.value)}
                            placeholder="Contoh: Dokumen penting kantor, pakaian batik, kue ulang tahun..."
                            className="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-xl border border-orange-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400 placeholder:font-normal shadow-xs"
                            required
                          />
                        </div>
                      </div>

                      {/* Optional Notes for Courier / Delivery */}
                      <div className="space-y-1 pt-1.5 border-t border-orange-200/70">
                        <label className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                          <span>Instruksi / Catatan Pengiriman (Opsional):</span>
                          <span className="text-[9px] text-slate-400 font-normal">Misal: Titip pos satpam</span>
                        </label>
                        <input
                          type="text"
                          value={packageNotes}
                          onChange={(e) => setPackageNotes(e.target.value)}
                          placeholder="Cth: Titipkan di satpam lobi timur, hubungi penerima saat tiba..."
                          className="w-full px-3 py-2 text-[11px] font-medium rounded-xl border border-orange-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-400 shadow-xs"
                        />
                      </div>

                      {/* Info Sameday */}
                      <div className="flex items-center gap-1.5 text-[10px] text-orange-700 bg-orange-100/70 p-2 rounded-xl border border-orange-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>Pengiriman Paket Kilat Sameday: Langsung dijemput & diantar hari ini dengan aman.</span>
                      </div>
                    </div>
                  )}

                  {/* KHUSUS OJEK FOOD: RESTO PROFILE & DAFTAR MENU MITRA */}
                  {selectedService === 'FOOD' && (
                    <div className="p-3.5 bg-gradient-to-br from-red-50/80 via-rose-50/60 to-red-50/40 border-2 border-red-400/80 rounded-2xl space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Resto Partner Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-red-200/70">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeMerchant.bannerImage}
                            alt={activeMerchant.storeName}
                            className="w-10 h-10 rounded-xl object-cover border border-red-300 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 line-clamp-1">{activeMerchant.storeName}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-red-100 text-red-700 text-[8px] font-black border border-red-300">
                                RESTO MITRA
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5">
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{activeMerchant.rating}</span>
                              </span>
                              <span>•</span>
                              <span className={`font-bold ${activeMerchant.isOpen ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {activeMerchant.isOpen ? '● BUKA' : '● TUTUP SEMENTARA'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items List with Increment / Decrement Counter */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-700 block uppercase tracking-wider">
                          Pilih Menu Makanan & Minuman:
                        </span>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {activeMerchant.menuItems.map((item) => {
                            const qty = cart[item.id] || 0;
                            return (
                              <div
                                key={item.id}
                                className="bg-white p-2.5 rounded-xl border border-red-100 shadow-xs flex items-center justify-between gap-2"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                                  <p className="text-[9px] text-slate-500 line-clamp-1">{item.description}</p>
                                  <span className="text-xs font-mono font-extrabold text-red-600">
                                    Rp {item.price.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCart((prev) => ({
                                        ...prev,
                                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                                      }));
                                    }}
                                    disabled={qty === 0}
                                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold font-mono text-slate-900">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCart((prev) => ({
                                        ...prev,
                                        [item.id]: (prev[item.id] || 0) + 1
                                      }));
                                    }}
                                    className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold hover:bg-red-700 shadow-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes for Merchant Kitchen */}
                      <div className="space-y-1 pt-1 border-t border-red-200/60">
                        <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                          <span>Catatan Pesanan untuk Dapur Resto:</span>
                          <span className="text-[9px] text-slate-400 font-normal">Misal: Sambal dipisah</span>
                        </label>
                        <input
                          type="text"
                          value={foodNotes}
                          onChange={(e) => setFoodNotes(e.target.value)}
                          placeholder="Cth: Sambal bawang dipisah, level 3, jangan terlalu asin..."
                          className="w-full px-3 py-2 text-[11px] font-medium rounded-xl border border-red-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pick-up Location Selector */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-xs hover:border-emerald-400 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>
                          {selectedService === 'SEND'
                            ? 'Titik Pengambilan / Pengirim'
                            : selectedService === 'FOOD'
                            ? 'Resto Mitra Penjual (Titik Ambil Makanan)'
                            : 'Titik Penjemputan'}
                        </span>
                      </span>
                      {selectedService !== 'FOOD' && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery({ field: 'origin', text: '' })}
                          className="text-[11px] font-semibold text-emerald-600 hover:underline"
                        >
                          Ganti Lokasi
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {selectedService === 'FOOD' ? activeMerchant.storeName : origin.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {selectedService === 'FOOD' ? activeMerchant.address : origin.address}
                    </div>
                  </div>

                  {/* Destination Location Selector */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-xs hover:border-rose-400 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-600 font-bold flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-rose-600" />
                        <span>
                          {selectedService === 'SEND'
                            ? 'Titik Penerima / Tujuan Antar'
                            : selectedService === 'FOOD'
                            ? 'Alamat Pengantaran Makanan (Pemesan)'
                            : 'Lokasi Tujuan'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery({ field: 'destination', text: '' })}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        Ganti Lokasi
                      </button>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{destination.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{destination.address}</div>
                  </div>

                  {/* Location Picker Modal Overlay */}
                  {searchQuery.field && (
                    <div className="p-3.5 bg-white rounded-2xl border-2 border-emerald-500 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700">
                        <span>Pilih {searchQuery.field === 'origin' ? 'Titik Penjemputan' : 'Lokasi Tujuan'}:</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery({ field: null, text: '' })}
                          className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {JAKARTA_LOCATIONS.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-emerald-50 text-slate-800 flex flex-col transition-colors border border-transparent hover:border-emerald-200"
                          >
                            <span className="font-bold text-slate-900">{loc.name}</span>
                            <span className="text-[10px] text-slate-500">{loc.address}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fare & Estimation Calculation Card */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Estimasi Jarak & Waktu Tempuh</span>
                      </div>
                      <span className="font-mono text-slate-900 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">
                        {previewDistance} km • ~{selectedService === 'FOOD' ? previewFare.durationMins + 15 : previewFare.durationMins} mnt
                      </span>
                    </div>

                    {selectedService === 'FOOD' && (
                      <div className="space-y-1 text-xs border-t border-slate-100 pt-2 text-slate-600">
                        <div className="flex justify-between">
                          <span>Subtotal Makanan ({totalFoodItemsCount} item):</span>
                          <span className="font-mono font-bold text-slate-900">Rp {foodSubtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ongkir Pengantaran Kurir:</span>
                          <span className="font-mono font-bold text-slate-900">Rp {previewFare.totalFare.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                          Total Tagihan ({ridePaymentMethod === 'DIGITAL_WALLET' ? 'OjekPay' : 'Bayar Tunai'}):
                        </span>
                        <span className="text-xl font-black text-emerald-600 font-mono">
                          Rp {(selectedService === 'FOOD' ? foodSubtotal + previewFare.totalFare : previewFare.totalFare).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-700 font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                          {ridePaymentMethod === 'DIGITAL_WALLET' ? 'Saldo OjekPay' : selectedService === 'SEND' ? 'Bayar Saat Sampai' : selectedService === 'FOOD' ? 'Bayar Tunai ke Kurir' : 'Bayar di Tujuan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Metode Pembayaran (OjekPay vs Tunai) */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Metode Pembayaran</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTopUpModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                      >
                        <PlusCircle className="w-3 h-3 text-emerald-600" />
                        <span>+ Top Up Saldo</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Opsi 1: OjekPay */}
                      <button
                        type="button"
                        onClick={() => setRidePaymentMethod('DIGITAL_WALLET')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          ridePaymentMethod === 'DIGITAL_WALLET'
                            ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-900">OjekPay</span>
                          </div>
                          {walletBalance >= (selectedService === 'FOOD' ? foodSubtotal + previewFare.totalFare : previewFare.totalFare) ? (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-100 text-emerald-800">
                              CUKUP
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-100 text-rose-800">
                              KURANG
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-800 mt-1">
                          Rp {walletBalance.toLocaleString('id-ID')}
                        </span>
                      </button>

                      {/* Opsi 2: Tunai */}
                      <button
                        type="button"
                        onClick={() => setRidePaymentMethod('CASH')}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          ridePaymentMethod === 'CASH'
                            ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-xs font-bold text-slate-900">Tunai</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-100 text-slate-600">
                            CASH
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Bayar langsung ke mitra
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Order Button with Dynamic Styling per Service */}
                  {selectedService === 'FOOD' ? (
                    <button
                      type="submit"
                      disabled={totalFoodItemsCount === 0}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Utensils className="w-5 h-5 text-white" />
                      <span>Pesan Ojek Food Sekarang (Rp {(foodSubtotal + previewFare.totalFare).toLocaleString('id-ID')})</span>
                    </button>
                  ) : selectedService === 'SEND' ? (
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Package className="w-5 h-5 text-white" />
                      <span>Pesan Kurir Paket Kilat Sekarang</span>
                    </button>
                  ) : selectedService === 'CAR' ? (
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 hover:from-blue-600 hover:to-indigo-800 text-white font-black text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Car className="w-5 h-5 text-white" />
                      <span>Pesan Ojek Car Sekarang</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Bike className="w-5 h-5 text-white" />
                      <span>Pesan Ojek Sekarang</span>
                    </button>
                  )}
                </form>
              )}

              {/* VIEW 2: SEARCHING DRIVER */}
              {currentOrder && currentOrder.status === 'SEARCHING' && (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3.5 shadow-md">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
                    <div className="w-14 h-14 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin"></div>
                    {currentOrder.serviceType === 'FOOD' ? (
                      <Utensils className="w-6 h-6 text-red-600 absolute" />
                    ) : currentOrder.serviceType === 'SEND' ? (
                      <Package className="w-6 h-6 text-orange-600 absolute" />
                    ) : currentOrder.serviceType === 'CAR' ? (
                      <Car className="w-6 h-6 text-blue-600 absolute" />
                    ) : (
                      <Bike className="w-6 h-6 text-emerald-600 absolute" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {currentOrder.serviceType === 'FOOD'
                        ? 'Mencari Kurir Ojek Food...'
                        : currentOrder.serviceType === 'SEND'
                        ? 'Mencari Kurir Paket Kilat...'
                        : currentOrder.serviceType === 'CAR'
                        ? 'Mencari Driver Ojek Car...'
                        : 'Mencari Driver Terdekat...'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {currentOrder.serviceType === 'FOOD'
                        ? 'Resto sedang menerima pesanan & mencari kurir terdekat untuk jemput makanan'
                        : 'Menghubungkan pesanan Anda ke mitra driver ojek di sekitar Gambir'}
                    </p>
                  </div>

                  {/* Detail Makanan jika Ojek Food */}
                  {currentOrder.serviceType === 'FOOD' && currentOrder.items && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-left space-y-1.5">
                      <div className="flex items-center justify-between text-red-800 font-extrabold">
                        <div className="flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-red-600" />
                          <span>{currentOrder.merchantName || 'Resto Mitra'}</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-black border border-red-200">
                          {currentOrder.merchantStatus === 'PREPARING' ? 'DIMASAK RESTO' : 'MENUNGGU RESTO'}
                        </span>
                      </div>
                      <div className="divide-y divide-red-100/80 pt-1">
                        {currentOrder.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between py-1 text-[11px]">
                            <span className="font-semibold text-slate-800">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono text-slate-600">
                              Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                      {currentOrder.merchantNotes && (
                        <p className="text-[10px] text-slate-500 italic bg-white/70 p-1.5 rounded-lg border border-red-100">
                          Catatan: {currentOrder.merchantNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Detail Belanja jika Belanja Toko Mitra */}
                  {currentOrder.serviceType === 'SHOPPING' && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-purple-800 font-extrabold">
                          <ShoppingBag className="w-4 h-4 text-purple-600" />
                          <span>Belanja • {currentOrder.merchantName || 'Toko Mitra'}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-mono">
                          {currentOrder.merchantStatus === 'PREPARING' ? 'SEDANG DIKEMAS' : 'MENUNGGU TOKO'}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2 space-y-1">
                        {currentOrder.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-800">{it.quantity}x {it.name}</span>
                            <span className="font-mono text-slate-600">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      {currentOrder.deliveryAddressNote && (
                        <p className="text-[10px] text-slate-600 bg-white/70 p-1.5 rounded-lg border border-purple-100">
                          <strong>Patokan Alamat:</strong> {currentOrder.deliveryAddressNote}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 pt-0.5">
                        <span>Metode Pembayaran:</span>
                        <span>{currentOrder.paymentMethod || 'Tunai / COD'}</span>
                      </div>
                    </div>
                  )}

                  {/* Detail Paket jika Paket Kilat */}
                  {currentOrder.serviceType === 'SEND' && currentOrder.packageType && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-orange-800 font-extrabold">
                        <Package className="w-4 h-4 text-orange-600" />
                        <span>Paket Kilat (Kirim Barang)</span>
                      </div>
                      <p className="text-slate-800 font-bold">
                        Jenis Barang: <span className="text-orange-700">{currentOrder.packageType}</span>
                      </p>
                      {currentOrder.packageNotes && (
                        <p className="text-[11px] text-slate-500">Catatan: {currentOrder.packageNotes}</p>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 rounded-xl text-xs font-mono font-bold text-emerald-700 border border-emerald-200">
                    Total Tagihan Tunai: Rp {currentOrder.totalFare.toLocaleString('id-ID')} ({currentOrder.distanceKm} km)
                  </div>

                  <button
                    onClick={() => onCancelOrder(currentOrder.orderId)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    Batalkan Pesanan
                  </button>
                </div>
              )}

              {/* VIEW 3: DRIVER FOUND & ON TRIP */}
              {currentOrder && (currentOrder.status === 'ACCEPTED' || currentOrder.status === 'ON_TRIP') && (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-2xl flex items-center justify-between shadow-xs border ${
                    currentOrder.serviceType === 'FOOD'
                      ? 'bg-red-50 border-red-200'
                      : currentOrder.serviceType === 'SHOPPING'
                      ? 'bg-purple-50 border-purple-200'
                      : currentOrder.serviceType === 'SEND'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-black block uppercase tracking-wider ${
                        currentOrder.serviceType === 'FOOD'
                          ? 'text-red-700'
                          : currentOrder.serviceType === 'SHOPPING'
                          ? 'text-purple-700'
                          : currentOrder.serviceType === 'SEND'
                          ? 'text-orange-700'
                          : 'text-blue-700'
                      }`}>
                        {currentOrder.serviceType === 'FOOD' ? (
                          currentOrder.merchantStatus === 'PREPARING'
                            ? '🍳 Dapur Resto Sedang Memasak Makanan'
                            : currentOrder.tripStep === 'HEADING_TO_PICKUP'
                            ? 'Kurir Menuju Resto Makanan'
                            : currentOrder.tripStep === 'ARRIVED_AT_PICKUP'
                            ? 'Kurir Tiba di Resto & Mengambil Pesanan'
                            : currentOrder.tripStep === 'ON_THE_WAY'
                            ? 'Makanan Sedang Diantar ke Rumah Anda'
                            : 'Kurir Tiba di Lokasi Anda'
                        ) : currentOrder.serviceType === 'SHOPPING' ? (
                          currentOrder.merchantStatus === 'PREPARING'
                            ? '📦 Toko Sedang Mengemas Barang'
                            : currentOrder.tripStep === 'HEADING_TO_PICKUP'
                            ? 'Kurir Menuju Toko Mitra'
                            : currentOrder.tripStep === 'ARRIVED_AT_PICKUP'
                            ? 'Kurir Tiba di Toko & Mengambil Barang'
                            : currentOrder.tripStep === 'ON_THE_WAY'
                            ? 'Barang Belanjaan Sedang Diantar ke Anda'
                            : 'Kurir Tiba di Alamat Pengiriman Anda'
                        ) : currentOrder.serviceType === 'SEND' ? (
                          currentOrder.tripStep === 'HEADING_TO_PICKUP' ? 'Kurir Menuju Titik Ambil Paket' :
                          currentOrder.tripStep === 'ARRIVED_AT_PICKUP' ? 'Kurir Tiba di Lokasi Ambil Paket!' :
                          currentOrder.tripStep === 'ON_THE_WAY' ? 'Paket Sedang Diantar ke Tujuan' :
                          'Kurir Tiba di Lokasi Penerima'
                        ) : (
                          currentOrder.tripStep === 'HEADING_TO_PICKUP' ? 'Driver Menuju Titik Jemput' :
                          currentOrder.tripStep === 'ARRIVED_AT_PICKUP' ? 'Driver Tiba di Titik Jemput!' :
                          currentOrder.tripStep === 'ON_THE_WAY' ? 'Sedang Mengantar ke Tujuan' :
                          'Tiba di Lokasi Tujuan'
                        )}
                      </span>
                      <p className="text-xs text-slate-800 font-semibold">
                        {currentOrder.serviceType === 'FOOD' ? (
                          currentOrder.tripStep === 'ON_THE_WAY'
                            ? 'Makanan hangat dalam perjalanan kilat bersama kurir'
                            : currentOrder.tripStep === 'ARRIVED_AT_PICKUP'
                            ? 'Kurir sedang memverifikasi pesanan di kasir resto'
                            : 'Harap tunggu, resto mitra sedang menyiapkan makanan lezat Anda'
                        ) : currentOrder.serviceType === 'SHOPPING' ? (
                          currentOrder.tripStep === 'ON_THE_WAY'
                            ? 'Barang belanjaan dalam perjalanan ekspres bersama kurir'
                            : currentOrder.tripStep === 'ARRIVED_AT_PICKUP'
                            ? 'Kurir sedang memeriksa kelengkapan barang belanjaan di toko'
                            : 'Toko mitra sedang menyiapkan dan mengemas pesanan barang Anda'
                        ) : currentOrder.serviceType === 'SEND' ? (
                          currentOrder.tripStep === 'HEADING_TO_PICKUP' ? 'Harap siapkan paket barang yang akan dikirim' :
                          currentOrder.tripStep === 'ARRIVED_AT_PICKUP' ? 'Serahkan paket barang ke kurir' :
                          currentOrder.tripStep === 'ON_THE_WAY' ? 'Paket dalam perjalanan ekspres' :
                          'Siapkan uang tunai ongkir untuk kurir'
                        ) : (
                          currentOrder.tripStep === 'HEADING_TO_PICKUP' ? 'Harap bersiap di titik penjemputan' :
                          currentOrder.tripStep === 'ARRIVED_AT_PICKUP' ? 'Driver sudah menunggu Anda' :
                          currentOrder.tripStep === 'ON_THE_WAY' ? 'Nikmati perjalanan dengan nyaman' :
                          'Siapkan uang tunai pas untuk driver'
                        )}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border animate-pulse ${
                      currentOrder.serviceType === 'FOOD'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : currentOrder.serviceType === 'SHOPPING'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : currentOrder.serviceType === 'SEND'
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      LIVE
                    </span>
                  </div>

                  {/* Detail Pesanan Makanan jika Ojek Food */}
                  {currentOrder.serviceType === 'FOOD' && currentOrder.items && (
                    <div className="p-3 bg-red-50/70 rounded-2xl border border-red-200 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-red-800">
                          <Utensils className="w-4 h-4 text-red-600" />
                          <span>{currentOrder.merchantName || 'Resto Mitra'}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900 font-mono">
                          {currentOrder.merchantStatus || 'MEMASAK'}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5 space-y-1 divide-y divide-red-100/60">
                        {currentOrder.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs pt-1">
                            <span className="font-bold text-slate-800">{it.quantity}x {it.name}</span>
                            <span className="font-mono text-slate-600">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      {currentOrder.merchantNotes && (
                        <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-red-200/60">
                          <span className="font-semibold text-slate-700">Catatan Resto:</span> {currentOrder.merchantNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail Belanja jika Belanja Barang Toko Mitra */}
                  {currentOrder.serviceType === 'SHOPPING' && currentOrder.items && (
                    <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-800">
                          <ShoppingBag className="w-4 h-4 text-purple-600" />
                          <span>{currentOrder.merchantName || 'Toko Mitra'}</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-mono">
                          {currentOrder.merchantStatus === 'READY_FOR_PICKUP' ? 'SIAP DIAMBIL' : 'DIKEMAS'}
                        </span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-2.5 space-y-1 divide-y divide-purple-100/60">
                        {currentOrder.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs pt-1">
                            <span className="font-bold text-slate-800">{it.quantity}x {it.name}</span>
                            <span className="font-mono text-slate-600">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      {currentOrder.deliveryAddressNote && (
                        <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-purple-200/60">
                          <span className="font-semibold text-slate-700">Patokan Alamat:</span> {currentOrder.deliveryAddressNote}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900 pt-1">
                        <span>Metode Pembayaran:</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                          {currentOrder.paymentMethod || 'Tunai / COD'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detail Paket jika Paket Kilat */}
                  {currentOrder.serviceType === 'SEND' && currentOrder.packageType && (
                    <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-orange-800">
                          <Package className="w-4 h-4 text-orange-600" />
                          <span>Paket Kilat (Kirim Barang)</span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 font-mono">
                          SAMEDAY
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-bold pt-0.5">
                        Jenis Paket: <span className="text-orange-700 underline font-black">{currentOrder.packageType}</span>
                      </div>
                      {currentOrder.packageNotes && (
                        <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-orange-200/60">
                          <span className="font-semibold text-slate-700">Catatan:</span> {currentOrder.packageNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Driver Card */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80"
                        alt="Foto Driver"
                        className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                      />
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{currentOrder.driverName || 'Budi Santoso'}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{currentOrder.driverVehicle || 'Honda Vario 160 (Hitam)'}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>4.92 (1,420 Trip Selesai)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-xs block shadow-xs">
                        {currentOrder.driverPlate || 'B 4920 SAK'}
                      </span>
                    </div>
                  </div>

                  {/* Payment & Route Summary */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col gap-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          {currentOrder.paymentMethod === 'DIGITAL_WALLET'
                            ? 'Total Tagihan (OjekPay):'
                            : currentOrder.paymentMethod === 'QRIS'
                            ? 'Total Tagihan (QRIS):'
                            : 'Total Tagihan (Tunai):'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-emerald-600 font-mono">
                            Rp {currentOrder.totalFare.toLocaleString('id-ID')}
                          </span>
                          {currentOrder.paymentMethod === 'DIGITAL_WALLET' || currentOrder.paymentStatus === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase border border-emerald-300">
                              Lunas (OjekPay)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider uppercase border border-amber-300">
                              Belum Lunas (Bayar Tunai)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          {currentOrder.serviceType === 'FOOD'
                            ? 'Alamat Antar Makanan:'
                            : currentOrder.serviceType === 'SHOPPING'
                            ? 'Alamat Pengiriman:'
                            : 'Destinasi:'}
                        </span>
                        <span className="font-bold text-slate-800 truncate max-w-[140px] block">
                          {currentOrder.destination.name}
                        </span>
                      </div>
                    </div>

                    {/* Tombol pelunasan cepat jika belum bayar dan ingin pakai OjekPay */}
                    {currentOrder.paymentStatus === 'UNPAID' && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">
                          Saldo OjekPay Anda: <span className="font-bold text-slate-800">Rp {walletBalance.toLocaleString('id-ID')}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (walletBalance < currentOrder.totalFare) {
                              setIsTopUpModalOpen(true);
                            } else {
                              realtimeStore.payOrderWithOjekPay(currentOrder.orderId);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Bayar Pakai Saldo OjekPay</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tombol Konfirmasi Barang / Makanan Diterima untuk SHOPPING & FOOD */}
                  {(currentOrder.serviceType === 'SHOPPING' || currentOrder.serviceType === 'FOOD') && (
                    <div className="pt-1">
                      {currentOrder.customerConfirmedReceived ? (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-black block">
                                {currentOrder.serviceType === 'FOOD' ? 'Makanan Sudah Diterima & Dinikmati' : 'Barang Sudah Diterima & Dikonfirmasi'}
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                {currentOrder.customerReviewNote ? `"${currentOrder.customerReviewNote}"` : 'Terima kasih atas konfirmasi Anda!'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 font-black bg-white px-2 py-1 rounded-full border border-amber-200 shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{currentOrder.rating || 5}.0</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowReceivedModal(true)}
                          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>
                            {currentOrder.serviceType === 'FOOD' ? 'Konfirmasi Makanan Diterima' : 'Konfirmasi Barang Diterima'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: COMPLETED */}
              {currentOrder && currentOrder.status === 'COMPLETED' && (
                <div className="p-6 bg-white rounded-2xl border border-emerald-200 text-center space-y-4 shadow-md">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      {currentOrder.serviceType === 'SHOPPING'
                        ? 'Barang Belanjaan Telah Sampai!'
                        : currentOrder.serviceType === 'FOOD'
                        ? 'Makanan Telah Sampai! Selamat Menikmati!'
                        : currentOrder.serviceType === 'SEND'
                        ? 'Paket Berhasil Dikirim!'
                        : 'Perjalanan Selesai!'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {currentOrder.serviceType === 'SHOPPING'
                        ? 'Pesanan barang dari toko mitra berhasil sampai dengan aman ke tangan Anda.'
                        : currentOrder.serviceType === 'FOOD'
                        ? 'Pesanan makanan lezat Anda telah diserahterimakan oleh kurir ojek.'
                        : currentOrder.serviceType === 'SEND'
                        ? 'Barang Anda telah sampai dengan aman ke tangan penerima.'
                        : 'Terima kasih telah bepergian bersama layanan Ojek Online.'}
                    </p>
                  </div>

                  {/* Konfirmasi Barang / Makanan Diterima untuk Shopping & Food */}
                  {(currentOrder.serviceType === 'SHOPPING' || currentOrder.serviceType === 'FOOD') && (
                    <div className="text-left">
                      {currentOrder.customerConfirmedReceived ? (
                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-black block text-xs">
                                {currentOrder.serviceType === 'FOOD' ? 'Makanan Terverifikasi Diterima' : 'Barang Terverifikasi Diterima'}
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                {currentOrder.customerReviewNote ? `"${currentOrder.customerReviewNote}"` : 'Terima kasih atas konfirmasi Anda!'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 font-black bg-white px-2 py-1 rounded-full border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{currentOrder.rating || 5}.0</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowReceivedModal(true)}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>
                            {currentOrder.serviceType === 'FOOD' ? 'Konfirmasi Makanan Diterima & Beri Ulasan' : 'Konfirmasi Barang Diterima & Beri Ulasan'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Info Paket Terkirim */}
                  {currentOrder.serviceType === 'SEND' && currentOrder.packageType && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-left space-y-1">
                      <span className="text-orange-800 font-bold block">Detail Paket Terkirim:</span>
                      <p className="text-slate-800 font-bold">
                        Jenis Barang: <span className="text-orange-700">{currentOrder.packageType}</span>
                      </p>
                      {currentOrder.packageNotes && (
                        <p className="text-[11px] text-slate-500">Catatan: {currentOrder.packageNotes}</p>
                      )}
                    </div>
                  )}

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                    <span className="text-xs text-emerald-800 font-bold">Pembayaran Diterima Kurir / Merchant</span>
                    <div className="text-2xl font-black text-emerald-700 font-mono">
                      Rp {currentOrder.totalFare.toLocaleString('id-ID')}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Metode: {currentOrder.paymentMethod === 'DIGITAL_WALLET' ? 'Saldo OjekPay (Lunas - Otomatis Terpotong)' : currentOrder.paymentMethod === 'QRIS' ? 'QRIS Digital' : 'Tunai / Cash'}
                    </p>
                  </div>

                  <button
                    onClick={onReset}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>Pesan Ojek Lagi</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 3: AKTIVITAS & RIWAYAT */}
        {activeTab === 'orders' && (
          <CustomerOrders
            currentOrder={currentOrder}
            onOpenRideBooking={() => setActiveTab('ride')}
            onReset={onReset}
          />
        )}

        {/* TAB 4: AKUN / PROFIL */}
        {activeTab === 'profile' && (
          <CustomerProfile onReset={onReset} />
        )}

      </div>

      {/* 3. DOCKED BOTTOM NAVIGATION BAR (Clean Bright Theme) */}
      <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
        {/* TAB HOME */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-emerald-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* TAB FOOD */}
        <button
          onClick={() => setActiveTab('food')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            activeTab === 'food'
              ? 'text-rose-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-[10px]">Food</span>
          <span className="absolute -top-1 -right-0.5 px-1 py-0.2 bg-rose-500 text-white text-[7px] font-black rounded-full shadow-xs">
            HOT
          </span>
        </button>

        {/* TAB BELANJA */}
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'shopping'
              ? 'text-purple-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px]">Belanja</span>
        </button>

        {/* TAB PAKET KILAT */}
        <button
          onClick={() => setActiveTab('send')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            activeTab === 'send'
              ? 'text-orange-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px]">Paket</span>
          {currentOrder?.serviceType === 'SEND' && isOrderActive && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
          )}
        </button>

        {/* TAB OJEK CAR (MOBIL) */}
        <button
          onClick={() => setActiveTab('car')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            activeTab === 'car'
              ? 'text-blue-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Car className="w-4 h-4" />
          <span className="text-[10px]">Car</span>
          {currentOrder?.serviceType === 'CAR' && isOrderActive && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          )}
        </button>

        {/* TAB RIDE / MAP */}
        <button
          onClick={() => setActiveTab('ride')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            activeTab === 'ride'
              ? 'text-emerald-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span className="text-[10px]">Ojek</span>
          {isOrderActive && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </button>

        {/* TAB AKTIVITAS */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'text-emerald-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span className="text-[10px]">Aktivitas</span>
        </button>

        {/* TAB AKUN */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-emerald-600 font-black'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px]">Akun</span>
        </button>
      </div>

      {/* MODAL KONFIRMASI BARANG / MAKANAN DITERIMA */}
      {showReceivedModal && currentOrder && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                {currentOrder.serviceType === 'FOOD' ? <Utensils className="w-6 h-6" /> : <PackageCheck className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-black text-slate-900">
                {currentOrder.serviceType === 'FOOD' ? 'Konfirmasi Makanan Diterima' : 'Konfirmasi Barang Diterima'}
              </h3>
              <p className="text-xs text-slate-500">
                Pastikan pesanan dari <strong className="text-slate-800">{currentOrder.merchantName}</strong> sudah lengkap dan dalam kondisi baik.
              </p>
            </div>

            {/* RATING BINTANG */}
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold text-slate-600 block">Beri Nilai Pesanan:</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= ratingScore
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-black text-amber-600 block font-mono">
                {ratingScore === 5 ? '⭐⭐⭐⭐⭐ Sangat Memuaskan!' :
                 ratingScore === 4 ? '⭐⭐⭐⭐ Bagus Sesuai' :
                 ratingScore === 3 ? '⭐⭐⭐ Cukup Baik' :
                 ratingScore === 2 ? '⭐⭐ Kurang Memuaskan' : '⭐ Kecewa'}
              </span>
            </div>

            {/* ULASAN INPUT */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Ulasan & Catatan Pembeli:
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Contoh: Barang lengkap, kondisi sangat baik, kurir cepat!"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs resize-none"
              />
            </div>

            {/* TOMBOL AKSI */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmittingReceived}
                onClick={() => setShowReceivedModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingReceived}
                onClick={handleConfirmReceived}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmittingReceived ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOP UP SALDO OJEKPAY */}
      <CustomerTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />

    </div>
  );
};
