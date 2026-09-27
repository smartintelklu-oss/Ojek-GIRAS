import React, { useState, useMemo, useEffect } from 'react';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import {
  Search,
  ShoppingBag,
  Store,
  Star,
  Plus,
  Minus,
  MessageCircle,
  CreditCard,
  Truck,
  MapPin,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Package,
  Clock,
  ShieldCheck,
  Wallet,
  QrCode,
  Building2,
  Trash2,
  Sparkles
} from 'lucide-react';
import {
  MenuItem,
  MerchantProfile,
  LocationPoint,
  ChatMessage,
  OrderData
} from '../types';
import { JAKARTA_LOCATIONS, calculateDistanceKm, calculateFare } from '../data/mockLocations';
import { realtimeStore } from '../services/realtimeStore';

interface CartItem {
  item: MenuItem;
  quantity: number;
  merchantId: string;
  merchantName: string;
}

interface CustomerShoppingProps {
  merchants: Record<string, MerchantProfile>;
  customerLocation: LocationPoint;
  onBackToHome?: () => void;
  onOrderCreated?: (orderId: string) => void;
  activeOrder?: OrderData | null;
  onOpenChatWithMerchant?: (merchantId: string, item?: MenuItem) => void;
}

export const CustomerShopping: React.FC<CustomerShoppingProps> = ({
  merchants,
  customerLocation,
  onBackToHome,
  onOrderCreated,
  activeOrder
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Selected Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<{
    item: MenuItem;
    merchant: MerchantProfile;
  } | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat Penjual Modal
  const [activeChatMerchant, setActiveChatMerchant] = useState<{
    merchant: MerchantProfile;
    product?: MenuItem;
  } | null>(null);
  const [chatInputText, setChatInputText] = useState('');

  // Checkout Review State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<LocationPoint>(customerLocation);
  const [addressDetailNote, setAddressDetailNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER'>('CASH');
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutSuccessOrderId, setCheckoutSuccessOrderId] = useState<string | null>(null);

  // OjekPay Wallet Balance State
  const [walletBalance, setWalletBalance] = useState<number>(() => realtimeStore.getCustomerWallet());
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = realtimeStore.subscribe(() => {
      setWalletBalance(realtimeStore.getCustomerWallet());
    });
    return () => unsub();
  }, []);

  // Collect all goods/items from all merchants that sell GOODS/MART
  const allGoodsWithMerchant = useMemo(() => {
    const list: { item: MenuItem; merchant: MerchantProfile }[] = [];
    (Object.values(merchants || {}) as MerchantProfile[]).forEach((merchant) => {
      // Include items marked as GOODS or from merchants with businessType !== 'FOOD'
      merchant.menuItems?.forEach((item) => {
        if (item.itemType === 'GOODS' || merchant.businessType === 'MART' || merchant.businessType === 'BOTH') {
          list.push({ item, merchant });
        }
      });
    });
    return list;
  }, [merchants]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    allGoodsWithMerchant.forEach(({ item }) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [allGoodsWithMerchant]);

  // Filtered goods by search and category
  const filteredGoods = useMemo(() => {
    return allGoodsWithMerchant.filter(({ item, merchant }) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.storeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'Semua' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [allGoodsWithMerchant, searchQuery, selectedCategory]);

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return (Object.values(cart) as CartItem[]).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return (Object.values(cart) as CartItem[]).reduce(
      (sum, item) => sum + item.item.price * item.quantity,
      0
    );
  }, [cart]);

  // Primary merchant for checkout (take the merchant from the cart items)
  const cartPrimaryMerchant = useMemo(() => {
    const firstCartItem = (Object.values(cart) as CartItem[])[0];
    if (!firstCartItem) return null;
    return merchants[firstCartItem.merchantId] || null;
  }, [cart, merchants]);

  // Ongkir calculation for checkout
  const checkoutDistance = useMemo(() => {
    if (!cartPrimaryMerchant) return 2.5;
    return calculateDistanceKm(
      cartPrimaryMerchant.location.lat,
      cartPrimaryMerchant.location.lng,
      deliveryAddress.lat,
      deliveryAddress.lng
    );
  }, [cartPrimaryMerchant, deliveryAddress]);

  const checkoutFare = useMemo(() => {
    return calculateFare(checkoutDistance);
  }, [checkoutDistance]);

  const totalBill = useMemo(() => {
    return cartSubtotal + checkoutFare.totalFare;
  }, [cartSubtotal, checkoutFare]);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add to cart helper
  const handleAddToCart = (item: MenuItem, merchant: MerchantProfile, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = (existing?.quantity || 0) + qty;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: newQty,
          merchantId: merchant.merchantId,
          merchantName: merchant.storeName
        }
      };
    });
    showToast(`Berhasil menambahkan ${qty}x ${item.name} ke keranjang!`);
  };

  // Update cart item quantity
  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...current, quantity: newQty }
      };
    });
  };

  // Quick direct buy
  const handleBuyNow = (item: MenuItem, merchant: MerchantProfile, qty: number = 1) => {
    // Add to cart and immediately open checkout
    setCart({
      [item.id]: {
        item,
        quantity: qty,
        merchantId: merchant.merchantId,
        merchantName: merchant.storeName
      }
    });
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Open product detail modal
  const handleOpenProductDetail = (item: MenuItem, merchant: MerchantProfile) => {
    setSelectedProduct({ item, merchant });
    setModalQty(1);
  };

  // Handle Chat Penjual
  const handleOpenChat = (merchant: MerchantProfile, item?: MenuItem) => {
    setActiveChatMerchant({ merchant, product: item });
    setSelectedProduct(null);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatMerchant) return;

    realtimeStore.sendChatMessage(activeChatMerchant.merchant.merchantId, {
      merchantId: activeChatMerchant.merchant.merchantId,
      sender: 'customer',
      senderName: 'Pelanggan',
      text: chatInputText.trim(),
      productId: activeChatMerchant.product?.id,
      productName: activeChatMerchant.product?.name,
      productPrice: activeChatMerchant.product?.price,
      productImage: activeChatMerchant.product?.imageUrl
    });

    setChatInputText('');
  };

  // Checkout submission
  const handleExecuteCheckout = () => {
    if (!cartPrimaryMerchant || totalCartCount === 0) return;

    // Total yang harus dibayar termasuk biaya layanan aplikasi (2.000)
    const totalPayable = totalBill + 2000;
    if (paymentMethod === 'DIGITAL_WALLET' && walletBalance < totalPayable) {
      setShowTopUpModal(true);
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const orderItems = (Object.values(cart) as CartItem[]).map((ci) => ({
        menuId: ci.item.id,
        name: ci.item.name,
        price: ci.item.price,
        quantity: ci.quantity,
        imageUrl: ci.item.imageUrl,
        itemType: 'GOODS' as const
      }));

      const newOrderId = realtimeStore.createShoppingOrder(
        cartPrimaryMerchant.merchantId,
        deliveryAddress,
        orderItems,
        paymentMethod,
        addressDetailNote.trim() || undefined,
        orderNotes.trim() || undefined
      );

      setIsProcessingPayment(false);
      setCheckoutSuccessOrderId(newOrderId);
      setCart({});
      setIsCheckoutOpen(false);

      if (onOrderCreated) {
        onOrderCreated(newOrderId);
      }
    }, 1200);
  };

  // Get active chats for current chat modal
  const currentMerchantChats = activeChatMerchant
    ? realtimeStore.getMerchantChats(activeChatMerchant.merchant.merchantId)
    : [];

  return (
    <div className="min-h-full pb-24 bg-slate-50 text-slate-900">
      {/* 1. TOP BAR & SEARCH HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Belanja Toko & Sembako Mitra</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Beli produk harian, retail, dan elektronik diantar kurir kilat
            </p>
          </div>

          {/* Floating Cart Button in Header */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-95 shadow-xs flex items-center gap-1.5 font-black text-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang jualan mitra (cth: beras, minyak, earphone)..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-100/90 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto p-3 bg-emerald-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. CATALOG PRODUCT GRID */}
      <div className="p-4 space-y-4">
        {/* Banner Promo Belanja */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md inline-block">
              Mitra Belanja Prioritas
            </span>
            <h3 className="text-sm font-black">Belanja Cepat Sampai di Rumah Anda</h3>
            <p className="text-[11px] text-emerald-100">
              Pilih produk toko mitra, chat penjual untuk konfirmasi stok, dan bayar di tempat (COD)!
            </p>
          </div>
          <Sparkles className="w-20 h-20 text-white/10 absolute -right-3 -bottom-3" />
        </div>

        {/* Section title & count */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Menampilkan {filteredGoods.length} produk jualan mitra</span>
          {selectedCategory !== 'Semua' && (
            <span className="text-emerald-600">Kategori: {selectedCategory}</span>
          )}
        </div>

        {filteredGoods.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Barang tidak ditemukan</h4>
            <p className="text-xs text-slate-400">
              Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="mt-2 px-3.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGoods.map(({ item, merchant }) => (
              <div
                key={item.id}
                onClick={() => handleOpenProductDetail(item, merchant)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
                    {item.category || 'Barang'}
                  </span>
                  {item.unit && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.unit}
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    {/* Merchant Store info */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5 truncate">
                      <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">{merchant.storeName}</span>
                    </div>

                    {/* Product Name */}
                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-tight">
                      {item.name}
                    </h4>
                  </div>

                  <div>
                    {/* Price and action button */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-xs font-black text-emerald-600 font-mono">
                          Rp {item.price.toLocaleString('id-ID')}
                        </span>
                        {item.stock !== undefined && (
                          <span className="block text-[9px] text-slate-400 font-medium">
                            Stok: {item.stock}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, merchant, 1);
                        }}
                        className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
                        title="Tambah ke Keranjang"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MODAL DETAIL PRODUK: CHAT PENJUAL, BELI, TAMBAH KERANJANG */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
              <img
                src={selectedProduct.item.imageUrl}
                alt={selectedProduct.item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedProduct.merchant.storeName}</span>
                <span className="text-amber-400 flex items-center gap-0.5 ml-1 text-[11px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {selectedProduct.merchant.rating}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedProduct.item.category || 'Barang Retail'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedProduct.item.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-black text-emerald-600 font-mono">
                    Rp {selectedProduct.item.price.toLocaleString('id-ID')}
                  </span>
                  {selectedProduct.item.unit && (
                    <span className="text-xs text-slate-400 font-bold">
                      / {selectedProduct.item.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-slate-700">Deskripsi Barang:</h5>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedProduct.item.description || 'Barang original kualitas terjamin langsung dari toko mitra resmi.'}
                </p>
              </div>

              {/* Info Toko Penjual */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Toko Mitra:</span>
                  <div className="text-xs font-extrabold text-slate-900">{selectedProduct.merchant.storeName}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-xs">{selectedProduct.merchant.address}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenChat(selectedProduct.merchant, selectedProduct.item)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 font-extrabold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chat</span>
                </button>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700">Jumlah Beli:</span>
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-sm font-black w-6 text-center">
                    {modalQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQty(modalQty + 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Prominent Action Buttons: CHAT PENJUAL, TAMBAH KERANJANG, BELI */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* 1. CHAT PENJUAL */}
                <button
                  type="button"
                  onClick={() => handleOpenChat(selectedProduct.merchant, selectedProduct.item)}
                  className="py-3 px-3 rounded-xl border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat Penjual</span>
                </button>

                {/* 2. TAMBAH KERANJANG */}
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedProduct.item, selectedProduct.merchant, modalQty);
                    setSelectedProduct(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>+ Keranjang</span>
                </button>
              </div>

              {/* 3. BELI SEKARANG */}
              <button
                type="button"
                onClick={() => handleBuyNow(selectedProduct.item, selectedProduct.merchant, modalQty)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Beli Sekarang (Rp {(selectedProduct.item.price * modalQty).toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL CHAT PENJUAL (LIVE CHAT INTERACTION) */}
      {activeChatMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Chat Header */}
            <div className="p-3.5 bg-emerald-600 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveChatMerchant(null)}
                  className="p-1.5 rounded-lg bg-emerald-700/50 hover:bg-emerald-700 text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="text-xs font-black truncate max-w-[200px]">
                    {activeChatMerchant.merchant.storeName}
                  </h4>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                    <span>Penjual Online • Respons Cepat</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveChatMerchant(null)}
                className="p-1 rounded-full hover:bg-emerald-700 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attached product card preview (if initiated from a product) */}
            {activeChatMerchant.product && (
              <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2.5">
                <img
                  src={activeChatMerchant.product.imageUrl}
                  alt={activeChatMerchant.product.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {activeChatMerchant.product.name}
                  </div>
                  <div className="text-[11px] font-black text-emerald-600 font-mono">
                    Rp {activeChatMerchant.product.price.toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleAddToCart(activeChatMerchant.product!, activeChatMerchant.merchant, 1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shrink-0"
                >
                  + Keranjang
                </button>
              </div>
            )}

            {/* Chat Messages List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50">
              <div className="text-center my-2">
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
                  Obrolan resmi dilindungi sistem Ojek Online
                </span>
              </div>

              {currentMerchantChats.length === 0 ? (
                <div className="p-4 text-center space-y-2 text-slate-400">
                  <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">
                    Mulai percakapan dengan penjual untuk tanya stok, spesifikasi, atau pengiriman!
                  </p>
                  {/* Quick message suggestions */}
                  <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                    <button
                      onClick={() => setChatInputText('Halo kak, apakah barang ini ready stok?')}
                      className="text-[10px] bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1 rounded-full"
                    >
                      "Apakah barang ini ready?"
                    </button>
                    <button
                      onClick={() => setChatInputText('Bisa dikirim langsung via kurir instan hari ini kak?')}
                      className="text-[10px] bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1 rounded-full"
                    >
                      "Bisa kirim hari ini?"
                    </button>
                  </div>
                </div>
              ) : (
                currentMerchantChats.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                        msg.sender === 'customer'
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <div className="text-[10px] font-bold opacity-75">
                        {msg.sender === 'customer' ? 'Anda' : msg.senderName}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className="text-[9px] text-right opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Tulis pesan ke penjual mitra..."
                className="flex-1 px-3 py-2 text-xs bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-slate-200"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-bold hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL KERANJANG BELANJA (CART SHEET) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Keranjang Belanja ({totalCartCount} item)
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {totalCartCount === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-200" />
                  <p className="text-xs font-bold text-slate-600">Keranjang belanja Anda masih kosong</p>
                  <p className="text-[11px]">Silakan pilih produk dari katalog toko mitra penjual.</p>
                </div>
              ) : (
                <>
                  {cartPrimaryMerchant && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2 text-emerald-900 font-bold">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Toko: {cartPrimaryMerchant.storeName}</span>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100">
                    {(Object.values(cart) as CartItem[]).map((ci) => (
                      <div key={ci.item.id} className="py-3 flex items-center justify-between gap-3">
                        <img
                          src={ci.item.imageUrl}
                          alt={ci.item.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {ci.item.name}
                          </h4>
                          <span className="text-xs font-black text-emerald-600 font-mono">
                            Rp {ci.item.price.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Qty controller */}
                        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-xl">
                          <button
                            onClick={() => handleUpdateCartQty(ci.item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 shadow-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-black w-4 text-center">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQty(ci.item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Catatan untuk Toko */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Catatan Tambahan untuk Penjual / Pengemasan:
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Cth: Tolong packing bubble wrap tebal, barang mudah pecah..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {totalCartCount > 0 && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Subtotal Barang:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
                >
                  <span>Lanjut ke Peninjauan Pesanan & Alamat</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL PENINJAUAN PESANAN (CHECKOUT FLOW: ALAMAT, ONGKIR, METODE BAYAR) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black text-slate-900">
                  Peninjauan Pesanan & Checkout Belanja
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checkout Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Toko Pengambilan */}
              {cartPrimaryMerchant && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Toko Pengirim / Pengambilan:</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">
                    {cartPrimaryMerchant.storeName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {cartPrimaryMerchant.address}
                  </div>
                </div>
              )}

              {/* Penentuan Alamat Pengiriman */}
              <div className="p-3.5 bg-white rounded-2xl border-2 border-emerald-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-700">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Alamat Pengantaran Pelanggan:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Ganti Lokasi
                  </button>
                </div>

                <div className="text-xs font-black text-slate-900">
                  {deliveryAddress.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {deliveryAddress.address}
                </div>

                {/* Location Picker Dropdown */}
                {isLocationSelectorOpen && (
                  <div className="p-2 bg-slate-50 rounded-xl border border-emerald-300 space-y-1 mt-2">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      Pilih Alamat Pengantaran di Jakarta:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {JAKARTA_LOCATIONS.map((loc) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            setDeliveryAddress(loc);
                            setIsLocationSelectorOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                            deliveryAddress.name === loc.name
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="font-bold">{loc.name}</div>
                          <div className={`text-[9px] truncate ${deliveryAddress.name === loc.name ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {loc.address}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan Patokan Alamat */}
                <div className="pt-1">
                  <input
                    type="text"
                    value={addressDetailNote}
                    onChange={(e) => setAddressDetailNote(e.target.value)}
                    placeholder="Nomor rumah / patokan / petunjuk kurir (cth: Pagar hitam depan musholla)..."
                    className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Rincian Barang yang Dipesan */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Ringkasan Barang ({totalCartCount} item):
                </span>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 divide-y divide-slate-200/60 text-xs">
                  {(Object.values(cart) as CartItem[]).map((ci) => (
                    <div key={ci.item.id} className="pt-1.5 first:pt-0 flex justify-between">
                      <span className="text-slate-800 font-medium">
                        {ci.quantity}x {ci.item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {(ci.item.price * ci.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pemilihan Metode Pembayaran */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Pilih Metode Pembayaran:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* CASH / COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tunai / COD</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Bayar langsung ke kurir saat barang sampai
                    </span>
                  </button>

                  {/* OjekPay / Saldo */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DIGITAL_WALLET')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'DIGITAL_WALLET'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
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
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-600">
                        Saldo: <strong>Rp {walletBalance.toLocaleString('id-ID')}</strong>
                      </span>
                      {walletBalance >= (totalBill + 2000) ? (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Cukup</span>
                      ) : (
                        <span className="text-[8px] bg-rose-100 text-rose-800 font-bold px-1 rounded">Kurang</span>
                      )}
                    </div>
                  </button>

                  {/* QRIS */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>QRIS Instan</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Scan semua e-wallet & m-banking
                    </span>
                  </button>

                  {/* Virtual Account Bank */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>VA Bank Transfer</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      BCA, Mandiri, BRI, BNI
                    </span>
                  </button>
                </div>
              </div>

              {/* Rincian Biaya Transparan */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkir Kurir Kilat ({checkoutDistance} km):</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {checkoutFare.totalFare.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Layanan Aplikasi:</span>
                  <span className="font-mono font-bold text-slate-900">Rp 2.000</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="font-extrabold text-slate-900">Total Pembayaran:</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    Rp {(totalBill + 2000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Checkout Button */}
            <div className="p-4 bg-white border-t border-slate-200">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleExecuteCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Memproses Checkout Pesanan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>Bayar & Buat Pesanan Belanja (Rp {(totalBill + 2000).toLocaleString('id-ID')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DIALOG SUKSES CHECKOUT */}
      {checkoutSuccessOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Pesanan Belanja Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Toko mitra sedang menyiapkan dan mengemas barang belanjaan Anda untuk dijemput kurir.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans">Nomor Pesanan:</span>
              <div className="font-extrabold text-emerald-700">{checkoutSuccessOrderId}</div>
            </div>

            <button
              onClick={() => {
                setCheckoutSuccessOrderId(null);
                if (onBackToHome) onBackToHome();
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors"
            >
              Lihat Status Pengiriman di Aktivitas
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar if items exist */}
      {totalCartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="fixed bottom-16 inset-x-4 max-w-md mx-auto z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between border border-slate-800 hover:bg-slate-800 transition-all active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {totalCartCount}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-medium">Keranjang Belanja</span>
                <span className="text-xs font-black text-white font-mono">
                  Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-400">
              <span>Buka Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
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
