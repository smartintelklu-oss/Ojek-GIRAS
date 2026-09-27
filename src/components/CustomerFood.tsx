import React, { useState, useMemo, useEffect } from 'react';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import {
  MenuItem,
  MerchantProfile,
  OrderData,
  LocationPoint,
  OrderItemDetail
} from '../types';
import {
  JAKARTA_LOCATIONS,
  calculateDistanceKm,
  calculateFare
} from '../data/mockLocations';
import { realtimeStore } from '../services/realtimeStore';
import {
  Search,
  Utensils,
  Store,
  Star,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Wallet,
  QrCode,
  Building,
  CreditCard,
  Banknote,
  MessageSquare,
  Send,
  X,
  Flame,
  Award,
  Coffee,
  HeartHandshake
} from 'lucide-react';

export interface FoodCartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
  merchantId: string;
  merchantName: string;
}

interface CustomerFoodProps {
  merchants?: Record<string, MerchantProfile>;
  currentOrder: OrderData | null;
  onBackToHome: () => void;
  onViewActiveOrder: () => void;
}

const FOOD_CATEGORIES = [
  { id: 'ALL', label: 'Semua Menu', icon: '🍽️' },
  { id: 'Makanan Utama', label: 'Makanan Utama', icon: '🍗' },
  { id: 'Mie & Pasta', label: 'Aneka Mie', icon: '🍜' },
  { id: 'Minuman Segar', label: 'Minuman Segar', icon: '🥤' },
  { id: 'Kopi & Minuman', label: 'Kopi Kenangan', icon: '☕' },
  { id: 'Roti & Toast', label: 'Roti & Toast', icon: '🍞' },
  { id: 'Camilan Tambahan', label: 'Camilan Gurih', icon: '🥟' }
];

export const CustomerFood: React.FC<CustomerFoodProps> = ({
  merchants,
  currentOrder,
  onBackToHome,
  onViewActiveOrder
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  // Cart State: key is menuItem id
  const [cart, setCart] = useState<Record<string, FoodCartItem>>({});

  // Item Detail & Customization Modal State
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<{
    item: MenuItem;
    merchantId: string;
    merchantName: string;
  } | null>(null);
  const [detailItemQty, setDetailItemQty] = useState(1);
  const [detailItemNotes, setDetailItemNotes] = useState('');

  // Cart Drawer & Checkout Modals
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderGeneralNotes, setOrderGeneralNotes] = useState('');

  // Delivery Address & Notes
  const [deliveryAddress, setDeliveryAddress] = useState<LocationPoint>(JAKARTA_LOCATIONS[2]); // Grand Indonesia
  const [isChangingAddress, setIsChangingAddress] = useState(false);

  // OjekPay Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number>(() => realtimeStore.getCustomerWallet());
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    const unsub = realtimeStore.subscribe(() => {
      setWalletBalance(realtimeStore.getCustomerWallet());
    });
    return () => unsub();
  }, []);
  const [deliveryAddressNote, setDeliveryAddressNote] = useState('Lantai 3, Kantor Ruang 302, titip di meja resepsionis');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER'>('CASH');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutSuccessOrderId, setCheckoutSuccessOrderId] = useState<string | null>(null);

  // Confirm Food Received Modal
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Quick Chat with Resto Modal
  const [chatResto, setChatResto] = useState<MerchantProfile | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatSentFeedback, setChatSentFeedback] = useState(false);

  // 1. Food Merchants List
  const foodMerchants = useMemo(() => {
    const list = Object.values(merchants || {}) as MerchantProfile[];
    return list.filter(
      (m) => m.businessType === 'FOOD' || m.businessType === 'BOTH' || m.businessType === undefined
    );
  }, [merchants]);

  // Primary active merchant if filtered
  const activeMerchant = useMemo(() => {
    if (selectedMerchantId) {
      return foodMerchants.find((m) => m.merchantId === selectedMerchantId) || null;
    }
    return null;
  }, [foodMerchants, selectedMerchantId]);

  // 2. All available food items with attached merchant context
  const allFoodItemsWithMerchant = useMemo(() => {
    const items: Array<{ item: MenuItem; merchantId: string; merchantName: string; merchantAddress: string; isOpen: boolean }> = [];
    foodMerchants.forEach((merch) => {
      (merch.menuItems || []).forEach((mItem) => {
        // filter food items only
        if (mItem.itemType === 'FOOD' || !mItem.itemType) {
          items.push({
            item: mItem,
            merchantId: merch.merchantId,
            merchantName: merch.storeName,
            merchantAddress: merch.address,
            isOpen: merch.isOpen
          });
        }
      });
    });
    return items;
  }, [foodMerchants]);

  // 3. Filtered food items based on search query, category, and selected merchant
  const filteredFoodItems = useMemo(() => {
    return allFoodItemsWithMerchant.filter(({ item, merchantId, merchantName }) => {
      // Filter by selected merchant
      if (selectedMerchantId && merchantId !== selectedMerchantId) {
        return false;
      }
      // Filter by category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchResto = merchantName.toLowerCase().includes(q);
        return matchName || matchDesc || matchResto;
      }
      return true;
    });
  }, [allFoodItemsWithMerchant, selectedMerchantId, selectedCategory, searchQuery]);

  // 4. Cart Calculations
  const cartItemsList = useMemo(() => {
    return (Object.values(cart) as FoodCartItem[]).filter((ci) => ci.quantity > 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cartItemsList.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cartItemsList]);

  const foodSubtotal = useMemo(() => {
    return cartItemsList.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  }, [cartItemsList]);

  // Primary merchant for current cart
  const cartPrimaryMerchant = useMemo(() => {
    if (cartItemsList.length === 0) return null;
    const firstMerchantId = cartItemsList[0].merchantId;
    return foodMerchants.find((m) => m.merchantId === firstMerchantId) || null;
  }, [cartItemsList, foodMerchants]);

  // Delivery distance and fare calculation
  const deliveryDistanceKm = useMemo(() => {
    if (!cartPrimaryMerchant) return 2.5;
    return calculateDistanceKm(
      cartPrimaryMerchant.location.lat,
      cartPrimaryMerchant.location.lng,
      deliveryAddress.lat,
      deliveryAddress.lng
    );
  }, [cartPrimaryMerchant, deliveryAddress]);

  const deliveryFare = useMemo(() => {
    return calculateFare(deliveryDistanceKm);
  }, [deliveryDistanceKm]);

  const appServiceFee = 2000;
  const promoDiscount = 5000; // Kupon Diskon Spesial Ojek Food
  const totalPayment = useMemo(() => {
    return Math.max(0, foodSubtotal + deliveryFare.totalFare + appServiceFee - promoDiscount);
  }, [foodSubtotal, deliveryFare, appServiceFee, promoDiscount]);

  // --- CART MUTATION HANDLERS ---
  const handleOpenDetailModal = (item: MenuItem, merchantId: string, merchantName: string) => {
    const existing = cart[item.id];
    setSelectedItemForDetail({ item, merchantId, merchantName });
    setDetailItemQty(existing ? existing.quantity : 1);
    setDetailItemNotes(existing?.notes || '');
  };

  const handleAddDetailToCart = () => {
    if (!selectedItemForDetail) return;
    const { item, merchantId, merchantName } = selectedItemForDetail;

    // Check if cart has items from another restaurant
    if (cartPrimaryMerchant && cartPrimaryMerchant.merchantId !== merchantId && cartItemsList.length > 0) {
      const confirmSwitch = window.confirm(
        `Keranjang Anda saat ini berisi menu dari "${cartPrimaryMerchant.storeName}". Mengganti resto akan mengosongkan keranjang sebelumnya. Lanjutkan?`
      );
      if (!confirmSwitch) return;
      setCart({
        [item.id]: {
          item,
          quantity: detailItemQty,
          notes: detailItemNotes,
          merchantId,
          merchantName
        }
      });
      setSelectedItemForDetail(null);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [item.id]: {
        item,
        quantity: detailItemQty,
        notes: detailItemNotes,
        merchantId,
        merchantName
      }
    }));
    setSelectedItemForDetail(null);
  };

  const handleQuickAddToCart = (item: MenuItem, merchantId: string, merchantName: string) => {
    if (cartPrimaryMerchant && cartPrimaryMerchant.merchantId !== merchantId && cartItemsList.length > 0) {
      handleOpenDetailModal(item, merchantId, merchantName);
      return;
    }

    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = (existing ? existing.quantity : 0) + 1;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: newQty,
          notes: existing?.notes || '',
          merchantId,
          merchantName
        }
      };
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const itemData = prev[itemId];
      if (!itemData) return prev;
      const newQty = itemData.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...itemData, quantity: newQty }
      };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // --- CHECKOUT FLOW ---
  const handleProceedToCheckout = () => {
    if (totalCartCount === 0 || !cartPrimaryMerchant) {
      alert('Keranjang makanan Anda masih kosong.');
      return;
    }
    setIsCartDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleExecuteCheckout = () => {
    if (!cartPrimaryMerchant) return;

    if (paymentMethod === 'DIGITAL_WALLET' && walletBalance < totalPayment) {
      setShowTopUpModal(true);
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const orderItems: OrderItemDetail[] = cartItemsList.map((ci) => ({
        menuId: ci.item.id,
        name: ci.item.name,
        price: ci.item.price,
        quantity: ci.quantity,
        notes: ci.notes,
        imageUrl: ci.item.imageUrl,
        itemType: 'FOOD'
      }));

      const newOrderId = realtimeStore.createFoodOrder(
        cartPrimaryMerchant.merchantId,
        deliveryAddress,
        orderItems,
        paymentMethod,
        deliveryAddressNote,
        orderGeneralNotes || 'Tolong jangan terlalu lama, sambal & kuah dipisah'
      );

      setIsProcessingPayment(false);
      setIsCheckoutModalOpen(false);
      setCart({});
      setCheckoutSuccessOrderId(newOrderId);
    }, 1200);
  };

  // --- CONFIRM FOOD RECEIVED ---
  const handleConfirmReceived = async () => {
    if (!currentOrder) return;
    setIsSubmittingReview(true);
    await realtimeStore.confirmOrderReceived(
      currentOrder.orderId,
      ratingScore,
      reviewComment || 'Makanan masih hangat lezat, rasa gurih mantap, kurir cepat dan ramah!'
    );
    setIsSubmittingReview(false);
    setShowConfirmReceivedModal(false);
  };

  // --- QUICK CHAT TO RESTO ---
  const handleSendChatToResto = () => {
    if (!chatMessageText.trim() || !chatResto) return;
    realtimeStore.sendChatMessage(chatResto.merchantId, {
      merchantId: chatResto.merchantId,
      sender: 'customer',
      senderName: 'Rian Pratama',
      text: chatMessageText,
      orderId: currentOrder?.orderId
    });
    setChatMessageText('');
    setChatSentFeedback(true);
    setTimeout(() => {
      setChatSentFeedback(false);
      setChatResto(null);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-hidden relative selection:bg-rose-500 selection:text-white">
      {/* 1. TOP HEADER & SEARCH BAR */}
      <div className="bg-white border-b border-slate-200/80 p-3.5 space-y-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-xs">
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight">
                  Ojek Food Kuliner
                </h1>
                <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[9px] border border-rose-300">
                  PESAN ANTAR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Pesan makanan lezat dari resto mitra terdekat
              </p>
            </div>
          </div>

          {/* Quick Cart Trigger */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] flex items-center justify-center shadow-xs animate-bounce">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ayam geprek, bebek hitam, kopi kenangan, mie..."
            className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 placeholder:font-normal shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Food Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {FOOD_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs scale-102 ring-1 ring-rose-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-[11px]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE FOOD ORDER BANNER (Jika sedang ada pesanan Food) */}
      {currentOrder && currentOrder.serviceType === 'FOOD' && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-3 mx-3 mt-3 rounded-2xl shadow-md space-y-2 border border-rose-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-white text-rose-700 font-bold shadow-xs">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 block">
                  PESANAN FOOD AKTIF
                </span>
                <p className="text-xs font-bold truncate max-w-[200px]">
                  {currentOrder.merchantName} • {currentOrder.items?.length || 1} Menu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                {currentOrder.status === 'SEARCHING'
                  ? 'Mencari Kurir'
                  : currentOrder.status === 'ACCEPTED'
                  ? 'Kurir Menuju Resto'
                  : currentOrder.status === 'ON_TRIP'
                  ? 'Makanan Diantar'
                  : currentOrder.status === 'COMPLETED'
                  ? 'Tiba'
                  : currentOrder.status}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-rose-500/50">
            <button
              onClick={onViewActiveOrder}
              className="text-xs font-bold text-white flex items-center gap-1 hover:underline"
            >
              <span>Pantau di Peta & Kurir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* BUTTON KONFIRMASI MAKANAN DITERIMA */}
            {currentOrder.customerConfirmedReceived ? (
              <div className="flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-xl text-emerald-100 border border-white/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Makanan Diterima (★ {currentOrder.customerRating || 5})</span>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReceivedModal(true)}
                className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Konfirmasi Makanan Diterima</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT: RESTO MITRA LIST & MENU CARDS */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-28">
        {/* Resto Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-rose-600" />
              <span>Pilihan Resto Mitra</span>
            </h2>
            {selectedMerchantId && (
              <button
                onClick={() => setSelectedMerchantId(null)}
                className="text-[10px] font-bold text-rose-600 hover:underline"
              >
                Lihat Semua Resto
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {foodMerchants.map((merch) => {
              const isChosen = selectedMerchantId === merch.merchantId;
              return (
                <button
                  key={merch.merchantId}
                  onClick={() =>
                    setSelectedMerchantId(isChosen ? null : merch.merchantId)
                  }
                  className={`p-2 rounded-2xl border transition-all flex items-center gap-2 shrink-0 max-w-[210px] text-left ${
                    isChosen
                      ? 'bg-rose-50 border-rose-500 shadow-xs ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
                  }`}
                >
                  <img
                    src={merch.bannerImage || merch.avatar}
                    alt={merch.storeName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-900 block truncate">
                      {merch.storeName}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{merch.rating}</span>
                      </span>
                      <span>•</span>
                      <span className={merch.isOpen ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                        {merch.isOpen ? 'Buka' : 'Tutup'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Resto Detail Info Banner */}
        {activeMerchant && (
          <div className="p-3 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200 space-y-2 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeMerchant.bannerImage || activeMerchant.avatar}
                  alt={activeMerchant.storeName}
                  className="w-12 h-12 rounded-xl object-cover border border-rose-300 shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black text-slate-900">
                      {activeMerchant.storeName}
                    </h3>
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 border border-rose-300">
                      MITRA RESMI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {activeMerchant.storeDescription}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5">
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{activeMerchant.rating}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>15-25 menit</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Penjual Button */}
              <button
                onClick={() => setChatResto(activeMerchant)}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-rose-200 text-rose-700 text-[10px] font-bold shadow-xs flex items-center gap-1 shrink-0"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat Resto</span>
              </button>
            </div>
          </div>
        )}

        {/* List of Food Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
              Daftar Menu ({filteredFoodItems.length} Tersedia)
            </span>
            <span className="text-[10px] text-slate-500">
              {selectedCategory !== 'ALL' ? selectedCategory : 'Semua Kategori'}
            </span>
          </div>

          {filteredFoodItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-slate-800">
                Menu Tidak Ditemukan
              </h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Coba gunakan kata kunci lain atau bersihkan filter pencarian Anda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedMerchantId(null);
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredFoodItems.map(({ item, merchantId, merchantName, isOpen }) => {
                const inCart = cart[item.id];
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 transition-all shadow-xs flex gap-3 relative group"
                  >
                    {/* Item Image */}
                    <div className="relative shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100 group-hover:scale-102 transition-transform"
                      />
                      {item.salesCount && item.salesCount > 100 && (
                        <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[8px] shadow-xs flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span>TERLARIS</span>
                        </span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4
                            onClick={() => handleOpenDetailModal(item, merchantId, merchantName)}
                            className="text-xs font-extrabold text-slate-900 line-clamp-1 hover:text-rose-600 cursor-pointer"
                          >
                            {item.name}
                          </h4>
                        </div>
                        <span className="text-[9px] font-bold text-rose-600 block line-clamp-1">
                          {merchantName}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      {/* Price & Action Button */}
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                        <span className="text-xs font-mono font-black text-slate-900">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>

                        {inCart ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 p-0.5 rounded-xl border border-rose-200">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-700 font-bold hover:bg-rose-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-black font-mono text-rose-900">
                              {inCart.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold hover:bg-rose-700 shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickAddToCart(item, merchantId, merchantName)}
                            disabled={!isOpen}
                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. FLOATING BOTTOM BAR (CART PREVIEW) */}
      {totalCartCount > 0 && !isCartDrawerOpen && !isCheckoutModalOpen && (
        <div className="absolute bottom-3 inset-x-3 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-rose-400/40">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-rose-700 font-mono font-black text-[10px] flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-200 font-bold block uppercase tracking-wider">
                  {cartPrimaryMerchant?.storeName || 'Keranjang Ojek Food'}
                </span>
                <span className="text-sm font-black font-mono text-white">
                  Rp {foodSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Lihat Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL DETAIL MENU & CATATAN MASAK (Food Customization) */}
      {selectedItemForDetail && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Detail Menu Makanan
              </span>
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Food Image Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={selectedItemForDetail.item.imageUrl}
                alt={selectedItemForDetail.item.name}
                className="w-full h-40 object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                {selectedItemForDetail.merchantName}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                {selectedItemForDetail.item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedItemForDetail.item.description}
              </p>
              <span className="text-base font-black font-mono text-rose-600 block mt-1">
                Rp {selectedItemForDetail.item.price.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Kitchen Customization Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Catatan Khusus untuk Dapur Resto (Opsional):
              </label>
              <input
                type="text"
                value={detailItemNotes}
                onChange={(e) => setDetailItemNotes(e.target.value)}
                placeholder="Cth: Level pedas 2, sambal & kuah dipisah, jangan pakai timun"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDetailItemQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-mono font-black text-slate-900">
                  {detailItemQty}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailItemQty((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddDetailToCart}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Tambahkan</span>
                <span>•</span>
                <span className="font-mono">
                  Rp {(selectedItemForDetail.item.price * detailItemQty).toLocaleString('id-ID')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KERANJANG BELANJA MAKANAN (Cart Drawer) */}
      {isCartDrawerOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Keranjang Makanan ({totalCartCount} item)
                  </h3>
                  <span className="text-[10px] text-rose-600 font-bold">
                    {cartPrimaryMerchant?.storeName || 'Resto Mitra'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {cartItemsList.map((ci) => (
                <div key={ci.item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <img
                    src={ci.item.imageUrl}
                    alt={ci.item.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {ci.item.name}
                    </h4>
                    {ci.notes && (
                      <p className="text-[9px] text-slate-500 italic truncate">
                        Catatan: {ci.notes}
                      </p>
                    )}
                    <span className="text-xs font-mono font-black text-rose-600">
                      Rp {(ci.item.price * ci.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(ci.item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-black text-slate-900">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(ci.item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(ci.item.id)}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-600 flex items-center justify-center"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* General Order Notes for Resto */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-700 block">
                Catatan Pengemasan & Alat Makan (Opsional):
              </label>
              <input
                type="text"
                value={orderGeneralNotes}
                onChange={(e) => setOrderGeneralNotes(e.target.value)}
                placeholder="Cth: Tolong sertakan sendok & garpu plastik, sambal dipisah"
                className="w-full px-3 py-2 text-[11px] rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            {/* Subtotal & Proceed to Checkout */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Subtotal Makanan:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  Rp {foodSubtotal.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Lanjut ke Peninjauan & Pembayaran</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL PENINJAUAN PESANAN, ALAMAT & METODE PEMBAYARAN (CHECKOUT) */}
      {isCheckoutModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[92vh] flex flex-col">
            {/* Header Checkout */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Peninjauan Pesanan Ojek Food
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Konfirmasi alamat, menu & metode pembayaran
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {/* RESTO INFO */}
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="text-[10px] text-rose-700 font-bold block">Resto Pengirim:</span>
                    <span className="font-extrabold text-slate-900">{cartPrimaryMerchant?.storeName}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-rose-200 text-rose-800">
                  {deliveryDistanceKm} km
                </span>
              </div>

              {/* 1. PENENTUAN ALAMAT PENGIRIMAN */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Alamat Pengantaran Makanan:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(true)}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Ganti Alamat
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-0.5">
                  <span className="font-bold text-slate-900 block">{deliveryAddress.name}</span>
                  <span className="text-[11px] text-slate-500 block">{deliveryAddress.address}</span>
                </div>

                {/* Input Catatan Patokan Alamat */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    Patokan Alamat untuk Kurir (Lantai / Blok / Cat Pagar):
                  </label>
                  <input
                    type="text"
                    value={deliveryAddressNote}
                    onChange={(e) => setDeliveryAddressNote(e.target.value)}
                    placeholder="Contoh: Gedung A, Lantai 3, Ruang 302, titip satpam"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* 2. RINGKASAN MENU YANG DIPESAN */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <span className="text-xs font-black text-slate-900 block">
                  Ringkasan Menu ({totalCartCount} item):
                </span>
                <div className="space-y-1.5 divide-y divide-slate-100 text-xs">
                  {cartItemsList.map((ci) => (
                    <div key={ci.item.id} className="pt-1.5 first:pt-0 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800">
                          {ci.quantity}x {ci.item.name}
                        </span>
                        {ci.notes && (
                          <span className="text-[10px] text-slate-500 italic block">
                            Note: {ci.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {(ci.item.price * ci.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. METODE PEMBAYARAN */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <span className="text-xs font-black text-slate-900 block">
                  Pilih Metode Pembayaran:
                </span>
                <div className="space-y-1.5">
                  {/* Option 1: Cash / COD */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="foodPaymentMethod"
                        checked={paymentMethod === 'CASH'}
                        onChange={() => setPaymentMethod('CASH')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          Tunai / Cash ke Kurir (COD)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Bayar langsung saat makanan tiba di alamat
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                      CASH
                    </span>
                  </label>

                  {/* Option 2: Digital Wallet */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'DIGITAL_WALLET'
                        ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="foodPaymentMethod"
                        checked={paymentMethod === 'DIGITAL_WALLET'}
                        onChange={() => setPaymentMethod('DIGITAL_WALLET')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          OjekPay (Saldo Digital)
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-500">
                            Saldo: <strong className="text-slate-800">Rp {walletBalance.toLocaleString('id-ID')}</strong>
                          </span>
                          {walletBalance >= totalPayment ? (
                            <span className="text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded text-[9px]">
                              Cukup
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-100 px-1 py-0.2 rounded text-[9px]">
                              Kurang
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTopUpModal(true);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                      >
                        + Top Up
                      </button>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                        INSTAN
                      </span>
                    </div>
                  </label>

                  {/* Option 3: QRIS */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="foodPaymentMethod"
                        checked={paymentMethod === 'QRIS'}
                        onChange={() => setPaymentMethod('QRIS')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          QRIS (GoPay, OVO, ShopeePay, DANA)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Scan barcode langsung dari e-wallet apapun
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800">
                      QRIS
                    </span>
                  </label>

                  {/* Option 4: Bank Transfer */}
                  <label
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="foodPaymentMethod"
                        checked={paymentMethod === 'BANK_TRANSFER'}
                        onChange={() => setPaymentMethod('BANK_TRANSFER')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          Transfer Bank (Virtual Account)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          BCA, Mandiri, BRI, BNI Virtual Account
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800">
                      VA
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. TRANSPARENT COST BREAKDOWN */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-black text-slate-900 block">Rincian Pembayaran:</span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal Menu Makanan:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {foodSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkir Pengantaran Kurir ({deliveryDistanceKm} km):</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {deliveryFare.totalFare.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Layanan & Asuransi:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {appServiceFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Voucher Diskon Kuliner Ojek Food:</span>
                    <span className="font-mono">-Rp {promoDiscount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-black text-slate-900 text-sm">Total Pembayaran:</span>
                  <span className="font-black font-mono text-base text-rose-600">
                    Rp {totalPayment.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Checkout & Pembayaran */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleExecuteCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Pesanan ke Resto...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pesan & Bayar Sekarang • Rp {totalPayment.toLocaleString('id-ID')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL GANTI ALAMAT PENGIRIMAN */}
      {isChangingAddress && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Pilih Lokasi Pengantaran</span>
              </h3>
              <button
                onClick={() => setIsChangingAddress(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {JAKARTA_LOCATIONS.map((loc, idx) => {
                const isSelected = deliveryAddress.name === loc.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDeliveryAddress(loc);
                      setIsChangingAddress(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{loc.name}</span>
                      <span className="text-[10px] text-slate-500 block line-clamp-1">{loc.address}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL KONFIRMASI MAKANAN DITERIMA & ULASAN */}
      {showConfirmReceivedModal && currentOrder && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Konfirmasi Makanan Diterima
              </h3>
              <p className="text-xs text-slate-500">
                Apakah pesanan makanan dari <strong className="text-slate-800">{currentOrder.merchantName}</strong> sudah tiba dengan hangat & lengkap?
              </p>
            </div>

            {/* Rating Bintang */}
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold text-slate-600 block">
                Beri Nilai Makanan & Kurir:
              </span>
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
                {ratingScore === 5
                  ? '⭐⭐⭐⭐⭐ Sangat Lezat & Cepat!'
                  : ratingScore === 4
                  ? '⭐⭐⭐⭐ Enak Sesuai Pesanan'
                  : ratingScore === 3
                  ? '⭐⭐⭐ Cukup Baik'
                  : ratingScore === 2
                  ? '⭐⭐ Kurang Memuaskan'
                  : '⭐ Kecewa'}
              </span>
            </div>

            {/* Input Review */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Ulasan Makanan & Catatan:
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Contoh: Makanan masih hangat lezat, rasa gurih mantap, kurir cepat dan ramah!"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => setShowConfirmReceivedModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleConfirmReceived}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmittingReview ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi Diterima</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL CHAT KE RESTO */}
      {chatResto && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-rose-600" />
                <div>
                  <h4 className="text-xs font-black text-slate-900">{chatResto.storeName}</h4>
                  <span className="text-[10px] text-emerald-700 font-bold">● Online</span>
                </div>
              </div>
              <button
                onClick={() => setChatResto(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {chatSentFeedback ? (
              <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <span className="text-xs font-black block">Pesan Terkirim ke Resto!</span>
                <p className="text-[10px] text-emerald-600">Resto akan segera membaca dan merespons pertanyaan Anda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  Tanyakan ketersediaan menu, tingkat kepedasan, atau bahan makanan langsung ke resto mitra:
                </p>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1">
                  {['Halo, apakah menu ayam geprek masih ready?', 'Bisa minta sambal dipisah?', 'Berapa lama estimasi masak?'].map(
                    (prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setChatMessageText(prompt)}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-[10px] text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200"
                      >
                        {prompt}
                      </button>
                    )
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    placeholder="Ketik pesan Anda ke pihak resto..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChatResto(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendChatToResto}
                    disabled={!chatMessageText.trim()}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. CHECKOUT SUCCESS BANNER / MODAL */}
      {checkoutSuccessOrderId && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-emerald-300 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Pesanan Ojek Food Berhasil!
              </h3>
              <p className="text-xs text-slate-500">
                Resto sedang menyiapkan makanan lezat Anda dan kurir ojek sedang bersiap menuju lokasi resto.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Pesanan:</span>
                <span className="font-mono font-bold text-slate-900">{checkoutSuccessOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alamat Antar:</span>
                <span className="font-bold text-slate-900 truncate max-w-[160px]">{deliveryAddress.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-black text-rose-600">
                  {paymentMethod === 'CASH'
                    ? 'Tunai (COD)'
                    : paymentMethod === 'DIGITAL_WALLET'
                    ? 'OjekPay'
                    : paymentMethod === 'QRIS'
                    ? 'QRIS'
                    : 'Virtual Account'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutSuccessOrderId(null);
                onViewActiveOrder();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Pantau Status Pesanan di Peta</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Top Up OjekPay */}
      <CustomerTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </div>
  );
};
