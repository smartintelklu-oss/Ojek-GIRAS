import React, { useState, useEffect } from 'react';
import { realtimeStore } from './services/realtimeStore';
import {
  LocationPoint,
  TripLifecycleStep,
  OrderData,
  FirebaseDatabaseSchema,
  MenuItem,
  MerchantPreparationStatus,
  OrderItemDetail
} from './types';
import { CustomerApp } from './components/CustomerApp';
import { DriverApp } from './components/DriverApp';
import { MerchantApp } from './components/MerchantApp';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { CodeDocsHub } from './components/CodeDocsHub';
import { FirebaseInspector } from './components/FirebaseInspector';
import { GENERATED_CODE_FILES } from './data/generatedCodeData';
import { INITIAL_CUSTOMER, INITIAL_DRIVER, INITIAL_MERCHANT } from './data/mockLocations';
import {
  Globe,
  Smartphone,
  Layers,
  Code,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  Columns,
  Sparkles,
  ArrowRight,
  User,
  Bike,
  ArrowLeft,
  Store,
  Utensils,
  Plus
} from 'lucide-react';

export default function App() {
  const [dbState, setDbState] = useState<FirebaseDatabaseSchema>(realtimeStore.getState());
  const [currentView, setCurrentView] = useState<'simulator' | 'architecture' | 'code' | 'database'>('simulator');
  
  // Role Selector: 'customer' (Pelanggan) | 'driver' (Mitra Driver) | 'merchant' (Mitra Penjual Resto) | 'dual' (Multi Device)
  const [selectedRole, setSelectedRole] = useState<'customer' | 'driver' | 'merchant' | 'dual'>('customer');
  const [multiDeviceTab, setMultiDeviceTab] = useState<'customer_driver' | 'customer_merchant' | 'triple'>('customer_driver');

  useEffect(() => {
    const unsubscribe = realtimeStore.subscribe((newState) => {
      setDbState(newState);
    });
    return unsubscribe;
  }, []);

  const driver = dbState.drivers[INITIAL_DRIVER.driverId] || Object.values(dbState.drivers)[0] || INITIAL_DRIVER;
  const ordersList: OrderData[] = Object.values(dbState.orders);
  const merchant = dbState.merchants[INITIAL_MERCHANT.merchantId] || Object.values(dbState.merchants)[0] || INITIAL_MERCHANT;
  
  // Find customer's active order
  const activeCustomerOrder = ordersList.find(
    (o) => (o.customerId === INITIAL_CUSTOMER.userId || o.customerId === 'cust-001') && o.status !== 'CANCELLED' && o.status !== 'COMPLETED'
  ) || null;

  // Find driver's active order or pending order
  const activeDriverOrder = driver?.currentOrderId
    ? dbState.orders[driver.currentOrderId] || null
    : null;

  const pendingSearchingOrder = ordersList.find(
    (o) => o.status === 'SEARCHING'
  ) || null;

  // Pending food orders for merchant
  const pendingFoodOrders = ordersList.filter(
    (o) => (o.serviceType === 'FOOD' || o.merchantId) && (!o.merchantStatus || o.merchantStatus === 'PENDING_CONFIRMATION')
  );

  // Action handlers connecting Customer, Driver, and Merchant through simulated Realtime Database
  const handleCreateOrder = (
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
  ) => {
    realtimeStore.createOrder(origin, destination, options);
  };

  const handleCancelOrder = (orderId: string) => {
    realtimeStore.cancelOrder(orderId);
  };

  const handleToggleOnline = (isOnline: boolean) => {
    realtimeStore.setDriverOnline(driver.driverId, isOnline);
  };

  const handleAcceptOrder = (orderId: string) => {
    realtimeStore.acceptOrder(orderId, driver.driverId);
  };

  const handleRejectOrder = (orderId: string) => {
    realtimeStore.rejectOrder(orderId);
  };

  const handleUpdateTripStep = (orderId: string, step: TripLifecycleStep) => {
    realtimeStore.updateTripStep(orderId, step);
  };

  // Merchant action handlers
  const handleToggleStoreOpen = (isOpen: boolean) => {
    realtimeStore.setMerchantOpen(merchant.merchantId, isOpen);
  };

  const handleToggleMenuAvailability = (menuItemId: string) => {
    realtimeStore.toggleMenuItemAvailability(merchant.merchantId, menuItemId);
  };

  const handleAddMenuItem = (item: Omit<MenuItem, 'id'>) => {
    realtimeStore.addMerchantMenuItem(merchant.merchantId, item);
  };

  const handleUpdateMerchantOrderStatus = (orderId: string, status: MerchantPreparationStatus) => {
    realtimeStore.updateMerchantOrderStatus(orderId, status);
  };

  const handleWithdrawMerchantBalance = (amount: number) => {
    return realtimeStore.withdrawMerchantBalance(merchant.merchantId, amount);
  };

  const handleSimulateFoodOrder = () => {
    const orderId = realtimeStore.createFoodOrder(
      merchant.merchantId,
      {
        name: 'Jl. Sabang No. 18, Menteng',
        address: 'Jl. H. Agus Salim No.18, Kebon Sirih, Menteng, Jakarta Pusat',
        lat: -6.1852,
        lng: 106.8248
      },
      [
        {
          menuId: merchant.menuItems[0]?.id || 'menu_01',
          name: merchant.menuItems[0]?.name || 'Nasi Goreng Spesial',
          price: merchant.menuItems[0]?.price || 25000,
          quantity: 2,
          notes: 'Pedas sedang, kerupuk banyak'
        },
        {
          menuId: merchant.menuItems[3]?.id || 'menu_04',
          name: merchant.menuItems[3]?.name || 'Es Teh Manis Melati Jumbo',
          price: merchant.menuItems[3]?.price || 6000,
          quantity: 2
        }
      ],
      'Sambal bawang tolong dipisah, sendok plastik 2 set.'
    );
    return orderId;
  };

  const handleSimulateRideOrder = () => {
    handleCreateOrder(
      {
        name: 'Stasiun Gambir',
        address: 'Jl. Medan Merdeka Timur No.1, Gambir, Jakarta Pusat',
        lat: -6.1767,
        lng: 106.8306
      },
      {
        name: 'Grand Indonesia Mall',
        address: 'Jl. M.H. Thamrin No.1, Kebon Melati, Jakarta Pusat',
        lat: -6.1950,
        lng: 106.8208
      },
      { serviceType: 'RIDE' }
    );
  };

  const handleReset = () => {
    realtimeStore.resetAll();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar (Bright Theme) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Project Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Ojek Online MVP
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  DUAL-APP + SHARED FIREBASE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pilih Role di bawah untuk membuka aplikasi yang diinginkan
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
            <button
              onClick={() => setCurrentView('simulator')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                currentView === 'simulator'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulasi (Pilih Role)</span>
            </button>
            <button
              onClick={() => setCurrentView('architecture')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                currentView === 'architecture'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Arsitektur Sistem</span>
            </button>
            <button
              onClick={() => setCurrentView('code')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                currentView === 'code'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Kode Sumber ({GENERATED_CODE_FILES.length})</span>
            </button>
            <button
              onClick={() => setCurrentView('database')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                currentView === 'database'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>RTDB Inspector</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* VIEW 1: ROLE-BASED SIMULATOR */}
        {currentView === 'simulator' && (
          <div className="space-y-6">
            
            {/* PRIMARY ROLE SELECTION CARDS (Bright Design) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>PILIHAN ROLE APLIKASI (Silakan Pilih Salah Satu):</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Kedua aplikasi ini terpisah secara fisik di HP masing-masing, namun terhubung langsung melalui satu backend Firebase.
                  </p>
                </div>

                {/* Reset State Button */}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 self-start sm:self-auto shrink-0 transition-colors shadow-xs"
                  title="Kembalikan posisi simulasi ke awal"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reset Data Order</span>
                </button>
              </div>

              {/* 4 Role Option Buttons / Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* ROLE 1: PELANGGAN (CUSTOMER) */}
                <button
                  onClick={() => setSelectedRole('customer')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'customer'
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-400/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${selectedRole === 'customer' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-xs' : 'bg-emerald-100 text-emerald-700'}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Role: Pelanggan</h3>
                          <span className="text-[10px] text-emerald-700 font-bold">Aplikasi Web / PWA</span>
                        </div>
                      </div>
                      {activeCustomerOrder && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                          {activeCustomerOrder.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed font-normal">
                      Pesan ojek, pesan makanan (Ojek Food), kirim paket, tentukan titik tujuan, dan pantau kurir di peta.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className={selectedRole === 'customer' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 font-medium'}>
                      {selectedRole === 'customer' ? '● Sedang Dibuka' : 'Klik untuk Buka'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${selectedRole === 'customer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </button>

                {/* ROLE 2: MITRA DRIVER */}
                <button
                  onClick={() => setSelectedRole('driver')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'driver'
                      ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-400/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${selectedRole === 'driver' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-xs' : 'bg-blue-100 text-blue-700'}`}>
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Role: Mitra Driver</h3>
                          <span className="text-[10px] text-blue-700 font-bold">Android Native (Kotlin)</span>
                        </div>
                      </div>
                      {pendingSearchingOrder && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-bounce">
                          ⚡ Ada Order!
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed font-normal">
                      Toggle Online/Offline, terima pesanan masuk secara real-time, jalankan GPS foreground, dan terima pembayaran cash.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className={selectedRole === 'driver' ? 'text-blue-700 font-extrabold' : 'text-slate-500 font-medium'}>
                      {selectedRole === 'driver' ? '● Sedang Dibuka' : 'Klik untuk Buka'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${selectedRole === 'driver' ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                </button>

                {/* ROLE 3: MITRA PENJUAL (MERCHANT RESTO) */}
                <button
                  onClick={() => setSelectedRole('merchant')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'merchant'
                      ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${selectedRole === 'merchant' ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white font-bold shadow-xs' : 'bg-amber-100 text-amber-700'}`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Role: Mitra Penjual</h3>
                          <span className="text-[10px] text-amber-700 font-bold">Aplikasi Merchant (Resto)</span>
                        </div>
                      </div>
                      {pendingFoodOrders.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-bounce">
                          🍳 {pendingFoodOrders.length} Order!
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${merchant.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {merchant.isOpen ? 'Buka' : 'Tutup'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed font-normal">
                      Kelola menu makanan, terima pesanan masuk & masak, pantau omset harian, dan tarik saldo dompet resto.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className={selectedRole === 'merchant' ? 'text-amber-700 font-extrabold' : 'text-slate-500 font-medium'}>
                      {selectedRole === 'merchant' ? '● Sedang Dibuka' : 'Klik untuk Buka'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${selectedRole === 'merchant' ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                </button>

                {/* ROLE 4: DEMO SINKRONISASI (MULTI SCREEN) */}
                <button
                  onClick={() => setSelectedRole('dual')}
                  className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'dual'
                      ? 'bg-purple-50/70 border-purple-500 shadow-md ring-2 ring-purple-400/20'
                      : 'bg-slate-50/70 border-slate-200 hover:border-purple-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${selectedRole === 'dual' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white font-bold shadow-xs' : 'bg-purple-100 text-purple-700'}`}>
                          <Columns className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Uji Sinkronisasi</h3>
                          <span className="text-[10px] text-purple-700 font-bold">Multi-HP Berdampingan</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                        Multi-Device
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed font-normal">
                      Uji alur lengkap: Pesan Makanan di HP Pelanggan ➔ Masak di HP Resto ➔ Antar di HP Driver.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className={selectedRole === 'dual' ? 'text-purple-700 font-extrabold' : 'text-slate-500 font-medium'}>
                      {selectedRole === 'dual' ? '● Sedang Dibuka' : 'Klik untuk Buka'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${selectedRole === 'dual' ? 'text-purple-600' : 'text-slate-400'}`} />
                  </div>
                </button>

              </div>
            </div>

            {/* ROLE DISPLAY CONTAINER */}

            {/* 1. JIKA MEMILIH ROLE PELANGGAN */}
            {selectedRole === 'customer' && (
              <div className="flex flex-col items-center space-y-4">
                {/* Role Guidance Header */}
                <div className="w-full max-w-md bg-white border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <span className="font-extrabold text-emerald-800 block">
                        Layar Aktif: Aplikasi Pelanggan (Web / PWA)
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Silakan buat pesanan ojek atau makanan, lalu beralih ke role Driver atau Resto.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRole('driver')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-xs"
                  >
                    <span>Layar Driver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Single Customer Mobile Phone with Sleek Light Chassis */}
                <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                  <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                    <CustomerApp
                      currentOrder={activeCustomerOrder}
                      driverLocation={driver?.location}
                      merchant={merchant}
                      merchants={dbState.merchants}
                      onCreateOrder={handleCreateOrder}
                      onCancelOrder={handleCancelOrder}
                      onReset={handleReset}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. JIKA MEMILIH ROLE MITRA DRIVER */}
            {selectedRole === 'driver' && (
              <div className="flex flex-col items-center space-y-4">
                {/* Role Guidance Header */}
                <div className="w-full max-w-md bg-white border border-blue-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <div>
                      <span className="font-extrabold text-blue-800 block">
                        Layar Aktif: Aplikasi Mitra Driver (Android Native Kotlin)
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Pastikan switch Online aktif. Jika ada pesanan masuk, dialog order akan berdering.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={handleSimulateRideOrder}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-xl text-xs transition-colors border border-blue-300 shadow-2xs"
                      title="Kirim 1 pesanan simulasi penumpang ke driver ini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Order Masuk</span>
                    </button>
                    <button
                      onClick={() => setSelectedRole('customer')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Layar Pelanggan</span>
                    </button>
                  </div>
                </div>

                {/* Single Driver Mobile Phone with Sleek Light Chassis */}
                <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                  <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                    <DriverApp
                      driver={driver}
                      activeOrder={activeDriverOrder}
                      pendingOrder={pendingSearchingOrder}
                      onToggleOnline={handleToggleOnline}
                      onAcceptOrder={handleAcceptOrder}
                      onRejectOrder={handleRejectOrder}
                      onUpdateTripStep={handleUpdateTripStep}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. JIKA MEMILIH ROLE MITRA PENJUAL (MERCHANT RESTO) */}
            {selectedRole === 'merchant' && (
              <div className="flex flex-col items-center space-y-4">
                {/* Role Guidance Header */}
                <div className="w-full max-w-md bg-white border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <div>
                      <span className="font-extrabold text-amber-900 block">
                        Layar Aktif: Aplikasi Mitra Penjual (Resto / Merchant)
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Kelola pesanan makanan masuk, menu kuliner resto, dan penarikan saldo omset.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={handleSimulateFoodOrder}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition-colors border border-amber-300 shadow-2xs"
                      title="Kirim 1 pesanan simulasi makanan ke dapur resto ini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Order Masuk</span>
                    </button>
                    <button
                      onClick={() => setSelectedRole('customer')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      <span>Layar Pemesan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Single Merchant Mobile Phone with Sleek Light Chassis */}
                <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                  <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                    <MerchantApp
                      merchant={merchant}
                      orders={ordersList}
                      onToggleStoreOpen={handleToggleStoreOpen}
                      onToggleMenuAvailability={handleToggleMenuAvailability}
                      onAddMenuItem={handleAddMenuItem}
                      onUpdateOrderStatus={handleUpdateMerchantOrderStatus}
                      onWithdrawBalance={handleWithdrawMerchantBalance}
                      onSimulateIncomingFoodOrder={handleSimulateFoodOrder}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. JIKA MEMILIH DUAL / MULTI-DEVICE MODE */}
            {selectedRole === 'dual' && (
              <div className="space-y-4">
                <div className="bg-white border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
                    <div>
                      <span className="font-extrabold text-purple-900 block">
                        Mode Uji Sinkronisasi: Multi-HP Berdampingan
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Pilih kombinasi tampilan HP untuk menguji sinkronisasi real-time antar pihak.
                      </span>
                    </div>
                  </div>

                  {/* Multi-Device Sub Tabs */}
                  <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200 text-xs self-start sm:self-auto shrink-0 overflow-x-auto">
                    <button
                      onClick={() => setMultiDeviceTab('customer_driver')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                        multiDeviceTab === 'customer_driver'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      Pelanggan + Driver
                    </button>
                    <button
                      onClick={() => setMultiDeviceTab('customer_merchant')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                        multiDeviceTab === 'customer_merchant'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      Pelanggan + Resto
                    </button>
                    <button
                      onClick={() => setMultiDeviceTab('triple')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                        multiDeviceTab === 'triple'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      Semua 3 HP Sekaligus
                    </button>
                  </div>
                </div>

                {/* Sub Tab 1: Customer + Driver */}
                {multiDeviceTab === 'customer_driver' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* SCREEN 1: APLIKASI PELANGGAN */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-slate-800">1. APLIKASI PELANGGAN (Web / React)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Tampilan Mobile Browser</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <CustomerApp
                            currentOrder={activeCustomerOrder}
                            driverLocation={driver?.location}
                            merchant={merchant}
                            merchants={dbState.merchants}
                            onCreateOrder={handleCreateOrder}
                            onCancelOrder={handleCancelOrder}
                            onReset={handleReset}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SCREEN 2: APLIKASI DRIVER */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-black text-slate-800">2. APLIKASI DRIVER (Android Kotlin)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Tampilan Native Jetpack Compose</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <DriverApp
                            driver={driver}
                            activeOrder={activeDriverOrder}
                            pendingOrder={pendingSearchingOrder}
                            onToggleOnline={handleToggleOnline}
                            onAcceptOrder={handleAcceptOrder}
                            onRejectOrder={handleRejectOrder}
                            onUpdateTripStep={handleUpdateTripStep}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 2: Customer + Merchant Resto */}
                {multiDeviceTab === 'customer_merchant' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* SCREEN 1: APLIKASI PELANGGAN */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-slate-800">1. APLIKASI PELANGGAN (Pesan Makanan)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Customer Web</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <CustomerApp
                            currentOrder={activeCustomerOrder}
                            driverLocation={driver?.location}
                            merchant={merchant}
                            merchants={dbState.merchants}
                            onCreateOrder={handleCreateOrder}
                            onCancelOrder={handleCancelOrder}
                            onReset={handleReset}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SCREEN 2: APLIKASI MITRA PENJUAL RESTO */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-black text-slate-800">2. MITRA PENJUAL (Terima & Masak)</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Merchant Resto App</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <MerchantApp
                            merchant={merchant}
                            orders={ordersList}
                            onToggleStoreOpen={handleToggleStoreOpen}
                            onToggleMenuAvailability={handleToggleMenuAvailability}
                            onAddMenuItem={handleAddMenuItem}
                            onUpdateOrderStatus={handleUpdateMerchantOrderStatus}
                            onWithdrawBalance={handleWithdrawMerchantBalance}
                            onSimulateIncomingFoodOrder={handleSimulateFoodOrder}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 3: Triple Device (Customer + Merchant + Driver) */}
                {multiDeviceTab === 'triple' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {/* SCREEN 1: APLIKASI PELANGGAN */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-slate-800">1. PELANGGAN</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Customer App</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <CustomerApp
                            currentOrder={activeCustomerOrder}
                            driverLocation={driver?.location}
                            merchant={merchant}
                            merchants={dbState.merchants}
                            onCreateOrder={handleCreateOrder}
                            onCancelOrder={handleCancelOrder}
                            onReset={handleReset}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SCREEN 2: APLIKASI MITRA PENJUAL RESTO */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-black text-slate-800">2. MITRA PENJUAL</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Merchant Resto</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <MerchantApp
                            merchant={merchant}
                            orders={ordersList}
                            onToggleStoreOpen={handleToggleStoreOpen}
                            onToggleMenuAvailability={handleToggleMenuAvailability}
                            onAddMenuItem={handleAddMenuItem}
                            onUpdateOrderStatus={handleUpdateMerchantOrderStatus}
                            onWithdrawBalance={handleWithdrawMerchantBalance}
                            onSimulateIncomingFoodOrder={handleSimulateFoodOrder}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SCREEN 3: APLIKASI DRIVER */}
                    <div className="flex flex-col items-center md:col-span-2 xl:col-span-1">
                      <div className="w-full flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-black text-slate-800">3. MITRA DRIVER</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Driver Kotlin</span>
                      </div>

                      <div className="w-full max-w-sm p-3 bg-white rounded-[44px] shadow-2xl border-4 border-slate-200/90 ring-1 ring-black/5">
                        <div className="w-full h-[680px] rounded-[34px] overflow-hidden">
                          <DriverApp
                            driver={driver}
                            activeOrder={activeDriverOrder}
                            pendingOrder={pendingSearchingOrder}
                            onToggleOnline={handleToggleOnline}
                            onAcceptOrder={handleAcceptOrder}
                            onRejectOrder={handleRejectOrder}
                            onUpdateTripStep={handleUpdateTripStep}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Compact Live Data Sync Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-700 font-bold">Firebase Realtime Sync:</span>
                  <span className="font-mono text-emerald-600 font-bold">Terhubung</span>
                </div>
                <div className="text-slate-500">
                  Total Order: <span className="font-mono text-slate-800 font-bold">{Object.keys(dbState.orders).length}</span>
                </div>
                <div className="text-slate-500">
                  Status Driver: <span className="font-mono text-slate-800 font-bold">{driver?.isOnline ? 'ONLINE (Siap Terima)' : 'OFFLINE'}</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('database')}
                className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
              >
                <span>Buka JSON Tree Database</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: ARCHITECTURE & STACK SPEC */}
        {currentView === 'architecture' && (
          <div className="space-y-6">
            <ArchitectureDiagram />

            {/* Detailed Component Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h4 className="text-sm font-extrabold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Formula Tarif Ojek Online (MVP)</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Perhitungan tarif dilakukan secara otomatis dan transparan pada sisi frontend & backend:
                  </p>
                  <div className="p-3 bg-emerald-50 rounded-xl font-mono text-[11px] text-emerald-900 border border-emerald-200 space-y-1">
                    <div>• Tarif Dasar (0 - 2.0 km): Rp 8.000</div>
                    <div>• Tarif Per KM Berikutnya: Rp 2.500 / km</div>
                    <div>• Biaya Layanan Aplikasi & Asuransi: Rp 2.000</div>
                    <div className="text-emerald-700 font-bold pt-1">Total = Base + (Max(0, KM - 2) * 2500) + 2000</div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pada rute Stasiun Gambir ke Grand Indonesia (3.4 km), estimasi tarif: Rp 8.000 + (1.4 × 2.500 = 3.500) + 2.000 = <strong className="text-slate-900">Rp 13.500 (Tunai)</strong>.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h4 className="text-sm font-extrabold text-blue-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mekanisme Fused Location Driver (GPS 2.5s)</span>
                </h4>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    Untuk memastikan pengemudi dapat dilacak secara mulus saat aplikasi di latar depan maupun latar belakang:
                  </p>
                  <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-900 border border-blue-200 space-y-1.5">
                    <div>1. <strong>Foreground Service:</strong> Menjaga proses tracking tetap hidup tanpa dibunuh sistem Android.</div>
                    <div>2. <strong>Priority HIGH_ACCURACY:</strong> Menggunakan kombinasi GPS chip, sinyal seluler, dan WiFi.</div>
                    <div>3. <strong>Firebase Node Write:</strong> Menulis ke <code>/drivers/{'{driverId}'}/location</code> dengan latency sub-100ms.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SOURCE CODE & DOCUMENTATION HUB */}
        {currentView === 'code' && (
          <div className="h-[750px]">
            <CodeDocsHub files={GENERATED_CODE_FILES} />
          </div>
        )}

        {/* VIEW 4: LIVE FIREBASE DATABASE INSPECTOR */}
        {currentView === 'database' && (
          <div className="h-[650px]">
            <FirebaseInspector state={dbState} onReset={handleReset} />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Ojek Online MVP Architecture • Customer Web (React) + Driver Android (Jetpack Compose) + Shared Firebase Realtime Database
        </p>
      </footer>
    </div>
  );
}
