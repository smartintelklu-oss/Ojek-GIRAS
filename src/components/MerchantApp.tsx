import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  Clock,
  Utensils,
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChefHat,
  Bike,
  Phone,
  MapPin,
  ChevronRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  Search,
  Check,
  X,
  Wallet,
  ArrowDownToLine,
  Building2,
  RotateCcw,
  BellRing,
  Info
} from 'lucide-react';
import {
  MerchantProfile,
  OrderData,
  MenuItem,
  OrderItemDetail,
  MerchantPreparationStatus
} from '../types';

interface MerchantAppProps {
  merchant: MerchantProfile;
  orders: OrderData[];
  onToggleStoreOpen: (isOpen: boolean) => void;
  onToggleMenuAvailability: (menuItemId: string) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem?: (item: MenuItem) => void;
  onDeleteMenuItem?: (menuItemId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: MerchantPreparationStatus) => void;
  onWithdrawBalance: (amount: number) => boolean;
  onSimulateIncomingFoodOrder?: () => void;
}

export const MerchantApp: React.FC<MerchantAppProps> = ({
  merchant,
  orders,
  onToggleStoreOpen,
  onToggleMenuAvailability,
  onAddMenuItem,
  onUpdateOrderStatus,
  onWithdrawBalance,
  onSimulateIncomingFoodOrder
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'finance' | 'info'>('orders');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'DONE'>('ALL');
  
  // Menu tab category filter & search
  const [selectedSellingType, setSelectedSellingType] = useState<'ALL' | 'FOOD' | 'GOODS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [menuSearch, setMenuSearch] = useState<string>('');
  
  // Modal states
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'FOOD' | 'GOODS'>('FOOD');
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState('Makanan Utama');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(20000);
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuImage, setNewMenuImage] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemStock, setNewItemStock] = useState<number>(50);

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100000);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Filter orders belonging to this merchant (both FOOD and SHOPPING)
  const merchantOrders = orders.filter(
    (o) => o.serviceType === 'FOOD' || o.serviceType === 'SHOPPING' || (o.merchantId && o.merchantId === merchant.merchantId)
  );

  const pendingOrders = merchantOrders.filter(
    (o) => !o.merchantStatus || o.merchantStatus === 'PENDING_CONFIRMATION'
  );
  const preparingOrders = merchantOrders.filter((o) => o.merchantStatus === 'PREPARING');
  const readyOrders = merchantOrders.filter((o) => o.merchantStatus === 'READY_FOR_PICKUP');
  const activeFoodOrders = merchantOrders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const completedFoodOrders = merchantOrders.filter((o) => o.status === 'COMPLETED');

  // Filter based on selected pill
  const displayedOrders = merchantOrders.filter((o) => {
    if (orderFilter === 'NEW') return !o.merchantStatus || o.merchantStatus === 'PENDING_CONFIRMATION';
    if (orderFilter === 'PREPARING') return o.merchantStatus === 'PREPARING';
    if (orderFilter === 'READY') return o.merchantStatus === 'READY_FOR_PICKUP';
    if (orderFilter === 'DONE') return o.status === 'COMPLETED';
    return true;
  });

  // Handle Add Menu Submit
  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || newMenuPrice <= 0) return;

    onAddMenuItem({
      name: newMenuName.trim(),
      category: newMenuCategory,
      price: Number(newMenuPrice),
      description: newMenuDesc.trim() || (newItemType === 'GOODS' ? 'Produk berkualitas dari toko mitra.' : 'Menu lezat pilihan resto mitra.'),
      imageUrl: newMenuImage.trim() || (newItemType === 'GOODS' 
        ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'),
      isAvailable: true,
      salesCount: 0,
      itemType: newItemType,
      unit: newItemType === 'GOODS' ? newItemUnit : undefined,
      stock: newItemType === 'GOODS' ? newItemStock : undefined
    });

    setNewMenuName('');
    setNewMenuDesc('');
    setNewMenuPrice(20000);
    setNewMenuImage('');
    setNewItemUnit('pcs');
    setNewItemStock(50);
    setShowAddMenuModal(false);
  };

  // Handle Withdrawal
  const handleExecuteWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > merchant.walletBalance) {
      alert('Nominal tidak valid atau saldo tidak mencukupi');
      return;
    }
    const success = onWithdrawBalance(withdrawAmount);
    if (success) {
      setWithdrawSuccessMsg(`Berhasil menarik Rp ${withdrawAmount.toLocaleString('id-ID')} ke rekening bank terdaftar!`);
      setTimeout(() => {
        setWithdrawSuccessMsg(null);
        setShowWithdrawModal(false);
      }, 2000);
    }
  };

  const foodCategories = ['Semua', 'Makanan Utama', 'Mie & Pasta', 'Minuman Segar', 'Camilan Tambahan'];
  const goodsCategories = ['Semua', 'Sembako & Dapur', 'Elektronik & Gadget', 'Perawatan & Kebersihan', 'Snack & Minuman', 'Perlengkapan Rumah', 'Lainnya'];
  
  const categories = selectedSellingType === 'GOODS' ? goodsCategories : selectedSellingType === 'FOOD' ? foodCategories : ['Semua', 'Makanan Utama', 'Minuman Segar', 'Sembako & Dapur', 'Elektronik & Gadget'];

  const filteredMenuItems = merchant.menuItems.filter((item) => {
    const matchesSellingType = 
      selectedSellingType === 'ALL' ||
      (selectedSellingType === 'FOOD' && (item.itemType === 'FOOD' || !item.itemType)) ||
      (selectedSellingType === 'GOODS' && item.itemType === 'GOODS');
    const matchesCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                          item.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesSellingType && matchesCat && matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-slate-800 font-sans select-none overflow-hidden">
      
      {/* 1. TOP APP BAR (Mitra Penjual / GoBiz Style) */}
      <header className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-3.5 shadow-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  MITRA PENJUAL
                </span>
                <span className="text-[10px] font-bold text-amber-200">★ {merchant.rating}</span>
              </div>
              <h2 className="text-xs font-black truncate max-w-[190px] leading-tight mt-0.5">
                {merchant.storeName}
              </h2>
            </div>
          </div>

          {/* Toggle Buka / Tutup Toko */}
          <button
            onClick={() => onToggleStoreOpen(!merchant.isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-sm ${
              merchant.isOpen
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-300'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 ring-2 ring-slate-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${merchant.isOpen ? 'bg-white animate-pulse' : 'bg-rose-400'}`}></span>
            <span>{merchant.isOpen ? 'Buka' : 'Tutup'}</span>
          </button>
        </div>

        {/* Quick Revenue Strip */}
        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-white/80 block">Omset Hari Ini</span>
              <span className="font-extrabold font-mono text-sm">
                Rp {merchant.todayRevenue.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <span className="text-[10px] text-white/80 block">Order Masuk</span>
              <span className="font-extrabold font-mono text-sm">
                {merchant.todayOrdersCount} Selesai
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors border border-white/25"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Tarik Rp {(merchant.walletBalance / 1000).toFixed(0)}k</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS */}
      <nav className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center justify-around text-xs shrink-0 shadow-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-black text-xs transition-all relative ${
            activeTab === 'orders'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Pesanan</span>
          {activeFoodOrders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ml-0.5 animate-bounce">
              {activeFoodOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-black text-xs transition-all ${
            activeTab === 'menu'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu & Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-black text-xs transition-all ${
            activeTab === 'finance'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Keuangan</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-black text-xs transition-all ${
            activeTab === 'info'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Profil Resto</span>
        </button>
      </nav>

      {/* 3. TAB CONTENTS */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        
        {/* --- TAB 1: PESANAN MASUK & PROSES MASAK (ORDERS) --- */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            
            {/* Status Toko Offline Warning */}
            {!merchant.isOpen && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Toko sedang tutup. Pelanggan belum bisa memesan makanan.</span>
                </div>
                <button
                  onClick={() => onToggleStoreOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0 hover:bg-amber-700"
                >
                  Buka Sekarang
                </button>
              </div>
            )}

            {/* Pipeline Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setOrderFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  orderFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua ({merchantOrders.length})
              </button>
              <button
                onClick={() => setOrderFilter('NEW')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  orderFilter === 'NEW'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                <span>Baru Masuk</span>
                {pendingOrders.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] flex items-center justify-center font-black">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setOrderFilter('PREPARING')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  orderFilter === 'PREPARING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                Sedang Masak ({preparingOrders.length})
              </button>
              <button
                onClick={() => setOrderFilter('READY')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  orderFilter === 'READY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Siap Diambil ({readyOrders.length})
              </button>
              <button
                onClick={() => setOrderFilter('DONE')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  orderFilter === 'DONE'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Selesai ({completedFoodOrders.length})
              </button>
            </div>

            {/* Fast Food Simulation Helper */}
            {onSimulateIncomingFoodOrder && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-orange-600 animate-bounce shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-950 block">Uji Coba Pesanan Food</span>
                    <span className="text-[10px] text-amber-700">Simulasikan pesanan masuk dari pelanggan</span>
                  </div>
                </div>
                <button
                  onClick={onSimulateIncomingFoodOrder}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-[11px] shadow-sm transition-transform active:scale-95"
                >
                  + Order Masuk
                </button>
              </div>
            )}

            {/* List of Orders */}
            {displayedOrders.length === 0 ? (
              <div className="py-12 px-4 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Utensils className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Belum Ada Pesanan</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Pesanan makanan dari pelanggan akan otomatis berdering dan muncul di sini.
                  </p>
                </div>
                {onSimulateIncomingFoodOrder && (
                  <button
                    onClick={onSimulateIncomingFoodOrder}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs rounded-xl shadow-md"
                  >
                    Kirim Pesanan Tes Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedOrders.map((order) => {
                  const isNew = !order.merchantStatus || order.merchantStatus === 'PENDING_CONFIRMATION';
                  const isPreparing = order.merchantStatus === 'PREPARING';
                  const isReady = order.merchantStatus === 'READY_FOR_PICKUP';
                  const isCompleted = order.status === 'COMPLETED';

                  return (
                    <div
                      key={order.orderId}
                      className={`p-4 rounded-3xl bg-white border-2 transition-all space-y-3 shadow-sm ${
                        isNew
                          ? 'border-rose-500 ring-2 ring-rose-400/20 shadow-rose-100'
                          : isPreparing
                          ? 'border-amber-500 shadow-amber-50'
                          : isReady
                          ? 'border-emerald-500'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isNew ? 'bg-rose-500 animate-ping' :
                            isPreparing ? 'bg-amber-500 animate-pulse' :
                            isReady ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {order.orderId}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            order.serviceType === 'SHOPPING' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.serviceType === 'SHOPPING' ? '🛍️ BELANJA' : '🍔 FOOD'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isNew ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          isPreparing ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          isReady ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {isNew ? '🔔 BARU MASUK' :
                           isPreparing ? (order.serviceType === 'SHOPPING' ? '📦 SEDANG DIKEMAS' : '👨‍🍳 SEDANG MASAK') :
                           isReady ? '🛵 SIAP PICK UP' :
                           'SELESAI'}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Pemesan:</span>
                          <span className="font-extrabold text-slate-900">{order.customerName}</span>
                          <span className="text-slate-500 text-[11px] block">{order.customerPhone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Tujuan Antar:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[150px] block">
                            {order.destination.name}
                          </span>
                        </div>
                      </div>

                      {/* Item List */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {order.serviceType === 'SHOPPING' ? 'Daftar Barang Belanjaan:' : 'Daftar Menu yang Dipesan:'}
                        </span>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                              <div>
                                <span className="font-black text-amber-800 font-mono mr-1.5">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-slate-800">{item.name}</span>
                                {item.notes && (
                                  <p className="text-[11px] text-rose-600 font-medium pl-5 italic">
                                    Catatan: "{item.notes}"
                                  </p>
                                )}
                              </div>
                              <span className="font-mono font-bold text-slate-700 shrink-0">
                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-between font-medium text-slate-700">
                            <span>1x Paket Pesanan Toko</span>
                            <span className="font-mono font-bold">Rp 24.000</span>
                          </div>
                        )}

                        {order.deliveryAddressNote && (
                          <div className="p-2 bg-blue-50 rounded-xl text-[11px] text-blue-900 font-medium border border-blue-200">
                            <strong>Patokan Alamat:</strong> {order.deliveryAddressNote}
                          </div>
                        )}

                        {order.merchantNotes && (
                          <div className="p-2 bg-amber-100/70 rounded-xl text-[11px] text-amber-900 font-medium border border-amber-200">
                            <strong>Instruksi Tambahan:</strong> {order.merchantNotes}
                          </div>
                        )}
                      </div>

                      {/* Customer Received Confirmation Badge */}
                      {order.customerConfirmedReceived && (
                        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between text-emerald-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-black block">Barang Diterima & Dikonfirmasi Pembeli</span>
                              <span className="text-[10px] text-emerald-700">
                                {order.customerReviewNote ? `"${order.customerReviewNote}"` : 'Pembeli puas dengan pesanan.'}
                              </span>
                            </div>
                          </div>
                          <span className="font-black text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                            ★ {order.rating || 5}.0
                          </span>
                        </div>
                      )}

                      {/* Total & Driver Info */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Driver Penjemput:</span>
                          {order.driverName ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                              <Bike className="w-3.5 h-3.5 text-blue-600" />
                              <span>{order.driverName} ({order.driverPlate || 'B 4920 SAK'})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Mencari driver terdekat...</span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {order.serviceType === 'SHOPPING' ? 'Subtotal Barang:' : 'Subtotal Makanan:'}
                          </span>
                          <span className="font-mono font-black text-amber-800 text-sm">
                            Rp {(order.foodSubtotal || order.totalFare || 24000).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons for Merchant */}
                      {!isCompleted && (
                        <div className="pt-2">
                          {isNew && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => onUpdateOrderStatus(order.orderId, 'PREPARING')}
                                className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                              >
                                <ChefHat className="w-4 h-4" />
                                <span>{order.serviceType === 'SHOPPING' ? 'Terima & Kemas Barang' : 'Terima & Mulai Masak'}</span>
                              </button>
                              <button
                                onClick={() => onUpdateOrderStatus(order.orderId, 'READY_FOR_PICKUP')}
                                className="w-full py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                              >
                                Langsung Siap
                              </button>
                            </div>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.orderId, 'READY_FOR_PICKUP')}
                              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <PackageCheck className="w-4 h-4" />
                              <span>{order.serviceType === 'SHOPPING' ? 'Barang Sudah Siap Diambil Driver' : 'Makanan Sudah Siap Diambil Driver'}</span>
                            </button>
                          )}

                          {isReady && (
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-extrabold block">
                                    {order.serviceType === 'SHOPPING' ? 'Barang Siap di Meja Pick-up' : 'Makanan Siap di Meja Pick-up'}
                                  </span>
                                  <span className="text-[10px] text-emerald-700">Driver akan mengonfirmasi pengambilan pesanan</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full">
                                Siap
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: KATALOG & KELOLA MENU (MENU) --- */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {/* Header & Add Menu Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Katalog Jualan Mitra</h3>
                <p className="text-[10px] text-slate-500">Pilihan Jualan: Food (Kuliner) & Barang (Retail / Sembako)</p>
              </div>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs rounded-xl shadow-sm hover:from-amber-600 hover:to-orange-700 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </div>

            {/* 2 PILIHAN JUALAN: FOOD & BARANG */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs">
              <button
                onClick={() => {
                  setSelectedSellingType('ALL');
                  setSelectedCategory('Semua');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all ${
                  selectedSellingType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Produk
              </button>
              <button
                onClick={() => {
                  setSelectedSellingType('FOOD');
                  setSelectedCategory('Semua');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 ${
                  selectedSellingType === 'FOOD'
                    ? 'bg-amber-500 text-white shadow-xs font-black'
                    : 'text-amber-800 hover:bg-amber-100/50'
                }`}
              >
                <span>🍔</span>
                <span>Pilihan Food</span>
              </button>
              <button
                onClick={() => {
                  setSelectedSellingType('GOODS');
                  setSelectedCategory('Semua');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 ${
                  selectedSellingType === 'GOODS'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-emerald-800 hover:bg-emerald-100/50'
                }`}
              >
                <span>🛍️</span>
                <span>Pilihan Barang</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search menu */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama menu atau deskripsi..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Menu Items List */}
            <div className="space-y-2.5">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl bg-white border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    item.isAvailable ? 'border-slate-200 hover:border-amber-400' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[190px]">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-black text-amber-700 text-xs">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {item.salesCount || 0} terjual
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Toggle */}
                  <div className="shrink-0 text-right">
                    <button
                      onClick={() => onToggleMenuAvailability(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Klik untuk ubah ketersediaan stok"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{item.isAvailable ? 'Tersedia' : 'Habis'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: KEUANGAN & SALDO (FINANCE) --- */}
        {activeTab === 'finance' && (
          <div className="space-y-3">
            {/* Saldo Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/90">Saldo Dompet Mitra Penjual</span>
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">Siap Tarik</span>
              </div>
              <div className="text-2xl font-black font-mono">
                Rp {merchant.walletBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-white/80">
                Pencairan dana langsung masuk ke rekening bank mitra tanpa biaya admin.
              </p>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-2.5 rounded-xl bg-white text-orange-700 font-black text-xs hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Tarik Saldo ke Rekening</span>
              </button>
            </div>

            {/* Rekap Penjualan Hari Ini */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase">Rekap Performa Resto</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Omset Hari Ini</span>
                  <span className="font-black text-slate-900 text-sm font-mono">
                    Rp {merchant.todayRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Order Selesai</span>
                  <span className="font-black text-slate-900 text-sm font-mono">
                    {merchant.todayOrdersCount} Pesanan
                  </span>
                </div>
              </div>
            </div>

            {/* Riwayat Pesanan Selesai */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight block">
                Riwayat Transaksi Terakhir:
              </span>
              {completedFoodOrders.length === 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  Belum ada pesanan yang diselesaikan hari ini.
                </div>
              ) : (
                completedFoodOrders.map((o) => (
                  <div key={o.orderId} className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <span className="font-black text-slate-800 block">{o.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {o.orderId}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black font-mono text-emerald-600 block">
                        +Rp {(o.foodSubtotal || o.totalFare || 24000).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">Lunas / Tunai</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: PROFIL RESTO (INFO) --- */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={merchant.avatar}
                  alt={merchant.storeName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Super Resto Mitra
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{merchant.storeName}</h3>
                  <p className="text-xs text-slate-500">{merchant.category}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Alamat Outlet:</span>
                    <span className="text-slate-600">{merchant.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Telepon Resto: </span>
                    <span className="text-slate-600">{merchant.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Penanggung Jawab: </span>
                    <span className="text-slate-600">{merchant.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Tips Meningkatkan Omset Mitra Penjual</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pastikan foto menu berkualitas jelas, pertahankan waktu persiapan makanan di bawah 15 menit, dan jaga stok menu selalu diperbarui agar rating resto tetap tinggi.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: TAMBAH MENU BARU */}
      {showAddMenuModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 border border-slate-200 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase">Tambah Menu Baru</h4>
              </div>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMenu} className="space-y-2.5 text-xs">
              {/* PILIHAN JENIS JUALAN: FOOD ATAU BARANG */}
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1">
                  Pilihan Jualan Mitra:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewItemType('FOOD');
                      setNewMenuCategory('Makanan Utama');
                    }}
                    className={`p-2 rounded-xl border text-center font-black transition-all flex items-center justify-center gap-1.5 ${
                      newItemType === 'FOOD'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍔</span>
                    <span>1. Food (Kuliner)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewItemType('GOODS');
                      setNewMenuCategory('Sembako & Dapur');
                    }}
                    className={`p-2 rounded-xl border text-center font-black transition-all flex items-center justify-center gap-1.5 ${
                      newItemType === 'GOODS'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🛍️</span>
                    <span>2. Barang (Retail)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  {newItemType === 'GOODS' ? 'Nama Barang Jualan *' : 'Nama Makanan / Minuman *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newItemType === 'GOODS' ? 'Contoh: Minyak Goreng Tropical 2 Liter' : 'Contoh: Bebek Goreng Sambal Ijo'}
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Kategori</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs"
                  >
                    {newItemType === 'GOODS' ? (
                      <>
                        <option value="Sembako & Dapur">Sembako & Dapur</option>
                        <option value="Elektronik & Gadget">Elektronik & Gadget</option>
                        <option value="Perawatan & Kebersihan">Perawatan & Kebersihan</option>
                        <option value="Snack & Minuman">Snack & Minuman</option>
                        <option value="Perlengkapan Rumah">Perlengkapan Rumah</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Makanan Utama">Makanan Utama</option>
                        <option value="Mie & Pasta">Mie & Pasta</option>
                        <option value="Minuman Segar">Minuman Segar</option>
                        <option value="Camilan Tambahan">Camilan Tambahan</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {newItemType === 'GOODS' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-1">Satuan Produk</label>
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                    >
                      <option value="pcs">pcs / buah</option>
                      <option value="kg">kg (kilogram)</option>
                      <option value="liter">liter</option>
                      <option value="bungkus">bungkus / sachet</option>
                      <option value="botol">botol</option>
                      <option value="pack">pack / kotak</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-1">Stok Tersedia</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  placeholder={newItemType === 'GOODS' ? 'Informasi spesifikasi, berat, atau merk barang...' : 'Rasa gurih, pedas nikmat dengan sambal segar...'}
                  value={newMenuDesc}
                  onChange={(e) => setNewMenuDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs shadow-md"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TARIK SALDO KE REKENING */}
      {showWithdrawModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 border border-slate-200 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase">Tarik Saldo Mitra</h4>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawSuccessMsg ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                <h5 className="text-xs font-black text-emerald-900">Penarikan Berhasil!</h5>
                <p className="text-[11px] text-emerald-700">{withdrawSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteWithdraw} className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block font-semibold">Saldo yang Tersedia:</span>
                  <span className="text-lg font-black font-mono text-amber-950">
                    Rp {merchant.walletBalance.toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Nominal Penarikan (Rp):</label>
                  <input
                    type="number"
                    min="50000"
                    step="50000"
                    max={merchant.walletBalance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono font-bold text-sm"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[50000, 100000, 250000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(amt)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                      >
                        {(amt / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-800">Rekening Tujuan:</div>
                  <div>Bank BCA • 829-102-4910</div>
                  <div className="text-[10px] text-slate-400">a.n. Siti Aminah (Mitra Terverifikasi)</div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md"
                  >
                    Konfirmasi Tarik
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
