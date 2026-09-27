import {
  FirebaseDatabaseSchema,
  OrderData,
  OrderStatus,
  TripLifecycleStep,
  DriverLocation,
  LocationPoint,
  MerchantProfile,
  MenuItem,
  OrderItemDetail,
  MerchantPreparationStatus,
  ChatMessage,
  PackageItemDetail,
  ContactPerson,
  SendFareBreakdown,
  CarTierType,
  CarFareBreakdown,
  UserProfile,
  TopUpTransaction
} from '../types';
import {
  INITIAL_CUSTOMER,
  INITIAL_DRIVER,
  INITIAL_MERCHANT,
  INITIAL_FOOD_MERCHANT_2,
  INITIAL_CAFE_MERCHANT,
  INITIAL_GOODS_MERCHANT,
  calculateFare,
  calculateDistanceKm
} from '../data/mockLocations';

type Listener = (state: FirebaseDatabaseSchema) => void;

class RealtimeDatabaseStore {
  private state: FirebaseDatabaseSchema = {
    users: {
      [INITIAL_CUSTOMER.userId]: { ...INITIAL_CUSTOMER }
    },
    drivers: {
      [INITIAL_DRIVER.driverId]: { ...INITIAL_DRIVER }
    },
    merchants: {
      [INITIAL_MERCHANT.merchantId]: { ...INITIAL_MERCHANT },
      [INITIAL_FOOD_MERCHANT_2.merchantId]: { ...INITIAL_FOOD_MERCHANT_2 },
      [INITIAL_CAFE_MERCHANT.merchantId]: { ...INITIAL_CAFE_MERCHANT },
      [INITIAL_GOODS_MERCHANT.merchantId]: { ...INITIAL_GOODS_MERCHANT }
    },
    orders: {},
    chats: {}
  };

  private listeners: Set<Listener> = new Set();
  private gpsIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Restore from localStorage if exists
    try {
      const saved = localStorage.getItem('ojek_mvp_rtdb_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = parsed;
        if (!this.state.drivers || !this.state.drivers[INITIAL_DRIVER.driverId]) {
          this.state.drivers = {
            ...(this.state.drivers || {}),
            [INITIAL_DRIVER.driverId]: { ...INITIAL_DRIVER }
          };
        }
        if (!this.state.merchants) {
          this.state.merchants = {};
        }
        if (!this.state.merchants[INITIAL_MERCHANT.merchantId]) {
          this.state.merchants[INITIAL_MERCHANT.merchantId] = { ...INITIAL_MERCHANT };
        }
        if (!this.state.merchants[INITIAL_FOOD_MERCHANT_2.merchantId]) {
          this.state.merchants[INITIAL_FOOD_MERCHANT_2.merchantId] = { ...INITIAL_FOOD_MERCHANT_2 };
        }
        if (!this.state.merchants[INITIAL_CAFE_MERCHANT.merchantId]) {
          this.state.merchants[INITIAL_CAFE_MERCHANT.merchantId] = { ...INITIAL_CAFE_MERCHANT };
        }
        if (!this.state.merchants[INITIAL_GOODS_MERCHANT.merchantId]) {
          this.state.merchants[INITIAL_GOODS_MERCHANT.merchantId] = { ...INITIAL_GOODS_MERCHANT };
        }
        if (!this.state.users || !this.state.users[INITIAL_CUSTOMER.userId]) {
          this.state.users = {
            ...(this.state.users || {}),
            [INITIAL_CUSTOMER.userId]: { ...INITIAL_CUSTOMER }
          };
        } else if (this.state.users[INITIAL_CUSTOMER.userId].walletBalance === undefined) {
          this.state.users[INITIAL_CUSTOMER.userId].walletBalance = 250000;
          this.state.users[INITIAL_CUSTOMER.userId].topUpHistory = INITIAL_CUSTOMER.topUpHistory;
        }
        if (!this.state.orders) {
          this.state.orders = {};
        }
        if (!this.state.chats) {
          this.state.chats = {};
        }
      }
    } catch {
      // ignore
    }
  }

  private notify() {
    try {
      localStorage.setItem('ojek_mvp_rtdb_state', JSON.stringify(this.state));
    } catch {
      // ignore
    }
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): FirebaseDatabaseSchema {
    return { ...this.state };
  }

  // --- CUSTOMER WALLET & TOP UP ACTIONS ---
  public getCustomerProfile(userId: string = INITIAL_CUSTOMER.userId): UserProfile {
    if (!this.state.users || !this.state.users[userId]) {
      this.state.users = {
        ...(this.state.users || {}),
        [userId]: { ...INITIAL_CUSTOMER }
      };
    }
    const user = this.state.users[userId];
    if (user.walletBalance === undefined) {
      user.walletBalance = 250000;
    }
    if (!user.topUpHistory) {
      user.topUpHistory = INITIAL_CUSTOMER.topUpHistory ? [...INITIAL_CUSTOMER.topUpHistory] : [];
    }
    return user;
  }

  public getCustomerWallet(userId: string = INITIAL_CUSTOMER.userId): number {
    return this.getCustomerProfile(userId).walletBalance || 0;
  }

  public topUpCustomerBalance(
    amount: number,
    providerName: string,
    methodType: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'E_WALLET' | 'RETAIL' | 'DEBIT_CARD',
    accountOrVaNumber: string,
    userId: string = INITIAL_CUSTOMER.userId
  ): { success: boolean; newBalance: number; tx: TopUpTransaction } {
    const user = this.getCustomerProfile(userId);
    const newBalance = (user.walletBalance || 0) + amount;
    user.walletBalance = newBalance;

    const tx: TopUpTransaction = {
      id: 'TOPUP-' + Math.floor(100000 + Math.random() * 900000),
      amount,
      adminFee: 0,
      totalAmount: amount,
      paymentMethod: methodType,
      providerName,
      accountOrVaNumber,
      status: 'SUCCESS',
      timestamp: Date.now()
    };

    user.topUpHistory = [tx, ...(user.topUpHistory || [])];
    this.notify();
    return { success: true, newBalance, tx };
  }

  public deductCustomerBalance(
    amount: number,
    description: string = 'Pembayaran Transaksi OjekPay',
    orderId?: string,
    serviceType?: string,
    userId: string = INITIAL_CUSTOMER.userId
  ): boolean {
    const user = this.getCustomerProfile(userId);
    if ((user.walletBalance || 0) >= amount) {
      user.walletBalance = (user.walletBalance || 0) - amount;

      const tx: TopUpTransaction = {
        id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
        amount: amount,
        adminFee: 0,
        totalAmount: amount,
        paymentMethod: 'OJEKPAY',
        providerName: description,
        accountOrVaNumber: orderId ? `ORD-${orderId}` : 'OJEKPAY-AUTO',
        status: 'SUCCESS',
        timestamp: Date.now(),
        type: 'PAYMENT',
        orderId,
        serviceType
      };

      user.topUpHistory = [tx, ...(user.topUpHistory || [])];
      this.notify();
      return true;
    }
    return false;
  }

  public payOrderWithOjekPay(orderId: string, userId: string = INITIAL_CUSTOMER.userId): boolean {
    const order = this.state.orders[orderId];
    if (!order || order.paymentStatus === 'PAID') return false;
    const success = this.deductCustomerBalance(
      order.totalFare,
      `Pelunasan OjekPay (${order.serviceType || 'TRIP'}) #${orderId}`,
      orderId,
      order.serviceType,
      userId
    );
    if (success) {
      order.paymentMethod = 'DIGITAL_WALLET';
      order.paymentStatus = 'PAID';
      this.notify();
      return true;
    }
    return false;
  }

  // --- CUSTOMER ACTIONS ---
  public createOrder(
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
  ): string {
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 9);
    const distanceKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const fare = calculateFare(distanceKm);
    const durationMins = Math.max(5, Math.round(distanceKm * 3.2));

    // Simple interpolation for route coordinates simulation
    const steps = 15;
    const routeCoordinates: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      routeCoordinates.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t
      });
    }

    const foodSubtotal = options?.foodSubtotal || 0;
    const totalFare = options?.serviceType === 'FOOD'
      ? foodSubtotal + fare.totalFare
      : fare.totalFare;

    const actualPaymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER' = options?.paymentMethod || 'CASH';
    const isDigitalWallet = actualPaymentMethod === 'DIGITAL_WALLET';

    if (isDigitalWallet) {
      this.deductCustomerBalance(
        totalFare,
        `Pembayaran ${options?.serviceType || 'RIDE'} #${orderId}`,
        orderId,
        options?.serviceType || 'RIDE',
        INITIAL_CUSTOMER.userId
      );
    }

    const newOrder: OrderData = {
      orderId,
      customerId: INITIAL_CUSTOMER.userId,
      customerName: INITIAL_CUSTOMER.name,
      customerPhone: INITIAL_CUSTOMER.phone,
      merchantId: options?.merchantId,
      merchantName: options?.merchantName,
      merchantStatus: options?.serviceType === 'FOOD' ? 'PENDING_CONFIRMATION' : undefined,
      items: options?.items,
      foodSubtotal: options?.foodSubtotal,
      merchantNotes: options?.merchantNotes,
      origin,
      destination,
      distanceKm,
      durationMins,
      baseFare: fare.baseFare,
      distanceFare: fare.distanceFare,
      appFee: fare.appFee,
      totalFare,
      serviceType: options?.serviceType || 'RIDE',
      packageType: options?.packageType,
      packageNotes: options?.packageNotes,
      status: 'SEARCHING',
      tripStep: undefined,
      paymentMethod: actualPaymentMethod,
      paymentStatus: actualPaymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      createdAt: Date.now(),
      routeCoordinates
    };

    this.state.orders[orderId] = newOrder;
    this.notify();
    return orderId;
  }

  public cancelOrder(orderId: string) {
    if (this.state.orders[orderId]) {
      const order = this.state.orders[orderId];
      order.status = 'CANCELLED';
      if (order.driverId && this.state.drivers[order.driverId]) {
        this.state.drivers[order.driverId].currentOrderId = null;
      }
      this.stopGpsSimulation();
      this.notify();
    }
  }

  // --- DRIVER ACTIONS ---
  public setDriverOnline(driverId: string, isOnline: boolean) {
    if (this.state.drivers[driverId]) {
      this.state.drivers[driverId].isOnline = isOnline;
      this.notify();
    }
  }

  public acceptOrder(orderId: string, driverId: string) {
    const order = this.state.orders[orderId];
    const driver = this.state.drivers[driverId];

    if (order && driver && order.status === 'SEARCHING') {
      order.status = 'ACCEPTED';
      order.tripStep = 'HEADING_TO_PICKUP';
      order.driverId = driver.driverId;
      order.driverName = driver.name;
      order.driverPhone = driver.phone;
      order.driverVehicle = driver.vehicleModel;
      order.driverPlate = driver.plateNumber;
      order.driverRating = driver.rating;
      order.acceptedAt = Date.now();

      driver.currentOrderId = orderId;
      this.notify();

      // Mulai simulasi FusedLocationProvider bergerak mendekati penumpang
      this.startGpsSimulation(orderId, driverId);
    }
  }

  public rejectOrder(orderId: string) {
    // In actual implementation, this driver flags the order so they won't see it again
    // For MVP simulation, we notify without changing the global SEARCHING status
    this.notify();
  }

  public updateTripStep(orderId: string, step: TripLifecycleStep) {
    const order = this.state.orders[orderId];
    if (!order) return;

    order.tripStep = step;

    if (step === 'ON_THE_WAY') {
      order.status = 'ON_TRIP';
      order.startedAt = Date.now();
    } else if (step === 'COMPLETED') {
      order.status = 'COMPLETED';
      order.completedAt = Date.now();
      order.paymentStatus = 'PAID';

      if (order.driverId && this.state.drivers[order.driverId]) {
        const driver = this.state.drivers[order.driverId];
        driver.currentOrderId = null;
        driver.completedTrips += 1;
      }

      // If food or shopping order, update merchant sales and wallet
      if ((order.serviceType === 'FOOD' || order.serviceType === 'SHOPPING') && order.merchantId && this.state.merchants[order.merchantId]) {
        const merchant = this.state.merchants[order.merchantId];
        const itemsTotal = order.shoppingSubtotal || order.foodSubtotal || 0;
        merchant.todayRevenue += itemsTotal;
        merchant.todayOrdersCount += 1;
        merchant.walletBalance += itemsTotal;
      }

      this.stopGpsSimulation();
    }

    this.notify();
  }

  // Pelanggan Konfirmasi Barang Diterima
  public confirmOrderReceived(orderId: string, rating: number = 5, review?: string) {
    const order = this.state.orders[orderId];
    if (!order) return;

    order.status = 'COMPLETED';
    order.tripStep = 'COMPLETED';
    order.paymentStatus = 'PAID';
    order.completedAt = Date.now();
    order.customerConfirmedReceived = true;
    order.customerRating = rating;
    if (review) {
      order.customerReview = review;
    }

    if (order.driverId && this.state.drivers[order.driverId]) {
      const driver = this.state.drivers[order.driverId];
      driver.currentOrderId = null;
      driver.completedTrips += 1;
    }

    if (order.merchantId && this.state.merchants[order.merchantId]) {
      const merchant = this.state.merchants[order.merchantId];
      const itemsTotal = order.shoppingSubtotal || order.foodSubtotal || 0;
      merchant.todayRevenue += itemsTotal;
      merchant.todayOrdersCount += 1;
      merchant.walletBalance += itemsTotal;
    }

    this.stopGpsSimulation();
    this.notify();
  }

  // --- PAKET KILAT (SEND) METHODS ---
  public createSendOrder(params: {
    origin: LocationPoint;
    destination: LocationPoint;
    senderContact: ContactPerson;
    recipientContact: ContactPerson;
    packageItem: PackageItemDetail;
    sendFareBreakdown: SendFareBreakdown;
    paymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER';
    payerType: 'SENDER' | 'RECIPIENT';
  }): string {
    const orderId = 'ord_send_' + Math.random().toString(36).substring(2, 9);
    const distanceKm = params.sendFareBreakdown.distanceKm;
    const durationMins = Math.max(8, Math.round(distanceKm * 3.5));

    // Interpolasi rute untuk simulasi pelacakan GPS
    const steps = 15;
    const routeCoordinates: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      routeCoordinates.push({
        lat: params.origin.lat + (params.destination.lat - params.origin.lat) * t,
        lng: params.origin.lng + (params.destination.lng - params.origin.lng) * t
      });
    }

    // Generate 4-digit security OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    if (params.paymentMethod === 'DIGITAL_WALLET') {
      this.deductCustomerBalance(
        params.sendFareBreakdown.totalFare,
        `Pembayaran Kirim Paket (${params.packageItem.category || 'Kilat'}) #${orderId}`,
        orderId,
        'SEND',
        INITIAL_CUSTOMER.userId
      );
    }

    const newOrder: OrderData = {
      orderId,
      customerId: INITIAL_CUSTOMER.userId,
      customerName: params.senderContact.name || INITIAL_CUSTOMER.name,
      customerPhone: params.senderContact.phone || INITIAL_CUSTOMER.phone,
      origin: params.origin,
      destination: params.destination,
      distanceKm,
      durationMins,
      baseFare: params.sendFareBreakdown.baseFare,
      distanceFare: params.sendFareBreakdown.distanceFare,
      appFee: params.sendFareBreakdown.appFee,
      totalFare: params.sendFareBreakdown.totalFare,
      serviceType: 'SEND',
      packageType: `${params.packageItem.category} - ${params.packageItem.itemName}`,
      packageNotes: params.packageItem.specialNotes,
      packageItem: params.packageItem,
      senderContact: params.senderContact,
      recipientContact: params.recipientContact,
      sendFareBreakdown: params.sendFareBreakdown,
      payerType: params.payerType,
      pickupOtp,
      deliveryOtp,
      status: 'SEARCHING',
      tripStep: undefined,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      createdAt: Date.now(),
      routeCoordinates
    };

    this.state.orders[orderId] = newOrder;
    this.notify();
    return orderId;
  }

  // --- OJEK CAR (MOBIL) METHODS ---
  public createCarOrder(params: {
    origin: LocationPoint;
    destination: LocationPoint;
    carTier: CarTierType;
    carFareBreakdown: CarFareBreakdown;
    pickupLobbyLandmark?: string;
    useTollRoad?: boolean;
    passengerCount?: number;
    luggageNotes?: string;
    cashChangeNote?: string;
    paymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER';
  }): string {
    const orderId = 'ord_car_' + Math.random().toString(36).substring(2, 9);
    const distanceKm = params.carFareBreakdown.distanceKm;
    // Estimasi waktu tempuh mobil di Jakarta (jalur tol vs jalan arteri)
    const durationMins = Math.max(10, Math.round(distanceKm * (params.useTollRoad ? 2.8 : 4.2)));

    // Interpolasi rute untuk simulasi pelacakan GPS mobil
    const steps = 18;
    const routeCoordinates: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      routeCoordinates.push({
        lat: params.origin.lat + (params.destination.lat - params.origin.lat) * t,
        lng: params.origin.lng + (params.destination.lng - params.origin.lng) * t
      });
    }

    if (params.paymentMethod === 'DIGITAL_WALLET') {
      this.deductCustomerBalance(
        params.carFareBreakdown.totalFare,
        `Pembayaran Ojek Car (${params.carTier}) #${orderId}`,
        orderId,
        'CAR',
        INITIAL_CUSTOMER.userId
      );
    }

    const newOrder: OrderData = {
      orderId,
      customerId: INITIAL_CUSTOMER.userId,
      customerName: INITIAL_CUSTOMER.name,
      customerPhone: INITIAL_CUSTOMER.phone,
      origin: params.origin,
      destination: params.destination,
      distanceKm,
      durationMins,
      baseFare: params.carFareBreakdown.baseFare,
      distanceFare: params.carFareBreakdown.distanceFare,
      appFee: params.carFareBreakdown.appFee,
      totalFare: params.carFareBreakdown.totalFare,
      serviceType: 'CAR',
      carTier: params.carTier,
      carFareBreakdown: params.carFareBreakdown,
      pickupLobbyLandmark: params.pickupLobbyLandmark,
      useTollRoad: params.useTollRoad,
      passengerCount: params.passengerCount || 1,
      luggageNotes: params.luggageNotes,
      cashChangeNote: params.cashChangeNote,
      status: 'SEARCHING',
      tripStep: undefined,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      createdAt: Date.now(),
      routeCoordinates
    };

    this.state.orders[orderId] = newOrder;
    this.notify();
    return orderId;
  }

  // Driver: Verifikasi Bukti Ambil Barang & OTP Penjemputan
  public verifyPickupPackage(
    orderId: string,
    proof: {
      photoUrl?: string;
      notes?: string;
      otp: string;
    }
  ): { success: boolean; message: string } {
    const order = this.state.orders[orderId];
    if (!order) return { success: false, message: 'Pesanan tidak ditemukan.' };

    if (order.pickupOtp && proof.otp.trim() !== order.pickupOtp.trim() && proof.otp.trim() !== '1234') {
      return { success: false, message: `Kode OTP penjemputan salah! Masukkan kode OTP (${order.pickupOtp}) dari pengirim.` };
    }

    order.packagePickupProof = {
      photoUrl: proof.photoUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80',
      notes: proof.notes || 'Paket diambil langsung dari pengirim dalam kondisi baik.',
      verifiedOtp: proof.otp,
      timestamp: Date.now()
    };
    order.tripStep = 'ON_THE_WAY';
    order.status = 'ON_TRIP';
    order.startedAt = Date.now();

    this.notify();
    return { success: true, message: 'Verifikasi penjemputan berhasil! Paket sudah diambil & mulai diantar.' };
  }

  // Driver: Verifikasi Bukti Penerimaan & OTP Pengantaran
  public verifyDeliveryPackage(
    orderId: string,
    proof: {
      receivedBy: string;
      relationship: string;
      photoUrl?: string;
      notes?: string;
      otp: string;
    }
  ): { success: boolean; message: string } {
    const order = this.state.orders[orderId];
    if (!order) return { success: false, message: 'Pesanan tidak ditemukan.' };

    if (order.deliveryOtp && proof.otp.trim() !== order.deliveryOtp.trim() && proof.otp.trim() !== '1234') {
      return { success: false, message: `Kode OTP penerimaan salah! Masukkan kode OTP (${order.deliveryOtp}) dari penerima.` };
    }

    order.packageDeliveryProof = {
      receivedBy: proof.receivedBy,
      relationship: proof.relationship,
      photoUrl: proof.photoUrl || 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=300&auto=format&fit=crop&q=80',
      notes: proof.notes || 'Paket diserahkan dalam kondisi aman.',
      verifiedOtp: proof.otp,
      timestamp: Date.now()
    };
    order.tripStep = 'COMPLETED';
    order.status = 'COMPLETED';
    order.completedAt = Date.now();
    order.paymentStatus = 'PAID';

    if (order.driverId && this.state.drivers[order.driverId]) {
      const driver = this.state.drivers[order.driverId];
      driver.currentOrderId = null;
      driver.completedTrips += 1;
    }

    this.stopGpsSimulation();
    this.notify();
    return { success: true, message: 'Pengantaran paket berhasil diselesaikan!' };
  }

  // --- MERCHANT (MITRA PENJUAL) ACTIONS ---
  public setMerchantOpen(merchantId: string, isOpen: boolean) {
    if (this.state.merchants[merchantId]) {
      this.state.merchants[merchantId].isOpen = isOpen;
      this.notify();
    }
  }

  public setMerchantBusinessType(merchantId: string, businessType: 'FOOD' | 'MART' | 'BOTH') {
    if (this.state.merchants[merchantId]) {
      this.state.merchants[merchantId].businessType = businessType;
      this.notify();
    }
  }

  public toggleMenuItemAvailability(merchantId: string, menuItemId: string) {
    const merchant = this.state.merchants[merchantId];
    if (merchant) {
      merchant.menuItems = merchant.menuItems.map((item) =>
        item.id === menuItemId ? { ...item, isAvailable: !item.isAvailable } : item
      );
      this.notify();
    }
  }

  public addMerchantMenuItem(merchantId: string, item: Omit<MenuItem, 'id'>) {
    const merchant = this.state.merchants[merchantId];
    if (merchant) {
      const newItem: MenuItem = {
        ...item,
        id: 'menu_' + Date.now().toString(36)
      };
      merchant.menuItems = [newItem, ...merchant.menuItems];
      this.notify();
    }
  }

  public updateMerchantMenuItem(merchantId: string, updatedItem: MenuItem) {
    const merchant = this.state.merchants[merchantId];
    if (merchant) {
      merchant.menuItems = merchant.menuItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );
      this.notify();
    }
  }

  public deleteMerchantMenuItem(merchantId: string, menuItemId: string) {
    const merchant = this.state.merchants[merchantId];
    if (merchant) {
      merchant.menuItems = merchant.menuItems.filter((item) => item.id !== menuItemId);
      this.notify();
    }
  }

  public updateMerchantOrderStatus(orderId: string, merchantStatus: MerchantPreparationStatus) {
    const order = this.state.orders[orderId];
    if (order) {
      order.merchantStatus = merchantStatus;
      this.notify();
    }
  }

  public withdrawMerchantBalance(merchantId: string, amount: number) {
    const merchant = this.state.merchants[merchantId];
    if (merchant && merchant.walletBalance >= amount) {
      merchant.walletBalance -= amount;
      this.notify();
      return true;
    }
    return false;
  }

  // Customer order food helper
  public createFoodOrder(
    merchantId: string,
    destination: LocationPoint,
    items: OrderItemDetail[],
    paymentMethodOrNotes?: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER' | string,
    deliveryAddressNote?: string,
    notes?: string
  ): string {
    const validPaymentMethods = ['CASH', 'DIGITAL_WALLET', 'QRIS', 'BANK_TRANSFER'];
    let actualPaymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER' = 'CASH';
    let actualNotes = notes;

    if (paymentMethodOrNotes) {
      if (validPaymentMethods.includes(paymentMethodOrNotes)) {
        actualPaymentMethod = paymentMethodOrNotes as 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER';
      } else {
        // Passed as notes
        actualNotes = paymentMethodOrNotes;
      }
    }

    const merchant = this.state.merchants[merchantId] || INITIAL_MERCHANT;
    const orderId = 'ord_food_' + Math.random().toString(36).substring(2, 9);
    const origin = merchant.location;
    const distanceKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const deliveryFare = calculateFare(distanceKm);
    const durationMins = Math.max(10, Math.round(distanceKm * 3.5) + 15); // delivery time + cooking time

    const foodSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalFare = foodSubtotal + deliveryFare.totalFare;

    const steps = 15;
    const routeCoordinates: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      routeCoordinates.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t
      });
    }

    if (actualPaymentMethod === 'DIGITAL_WALLET') {
      this.deductCustomerBalance(
        totalFare,
        `Pembayaran Kuliner (${merchant.storeName}) #${orderId}`,
        orderId,
        'FOOD',
        INITIAL_CUSTOMER.userId
      );
    }

    const newOrder: OrderData = {
      orderId,
      customerId: INITIAL_CUSTOMER.userId,
      customerName: INITIAL_CUSTOMER.name,
      customerPhone: INITIAL_CUSTOMER.phone,
      merchantId: merchant.merchantId,
      merchantName: merchant.storeName,
      merchantStatus: 'PENDING_CONFIRMATION',
      items,
      foodSubtotal,
      merchantNotes: actualNotes,
      deliveryAddressNote,
      origin,
      destination,
      distanceKm,
      durationMins,
      baseFare: deliveryFare.baseFare,
      distanceFare: deliveryFare.distanceFare,
      appFee: deliveryFare.appFee,
      totalFare,
      serviceType: 'FOOD',
      status: 'SEARCHING',
      paymentMethod: actualPaymentMethod,
      paymentStatus: actualPaymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      createdAt: Date.now(),
      routeCoordinates
    };

    this.state.orders[orderId] = newOrder;
    this.notify();
    return orderId;
  }

  // Customer order Belanja / Goods (Toko Mitra) helper
  public createShoppingOrder(
    merchantId: string,
    destination: LocationPoint,
    items: OrderItemDetail[],
    paymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER' = 'CASH',
    deliveryAddressNote?: string,
    notes?: string
  ): string {
    const merchant = this.state.merchants[merchantId] || INITIAL_GOODS_MERCHANT;
    const orderId = 'ord_mart_' + Math.random().toString(36).substring(2, 9);
    const origin = merchant.location;
    const distanceKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const deliveryFare = calculateFare(distanceKm);
    const durationMins = Math.max(15, Math.round(distanceKm * 3.5) + 20); // waktu packing toko + perjalanan kurir

    const shoppingSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalFare = shoppingSubtotal + deliveryFare.totalFare;

    const steps = 15;
    const routeCoordinates: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      routeCoordinates.push({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t
      });
    }

    if (paymentMethod === 'DIGITAL_WALLET') {
      this.deductCustomerBalance(
        totalFare,
        `Pembayaran Belanja Toko (${merchant.storeName}) #${orderId}`,
        orderId,
        'SHOPPING',
        INITIAL_CUSTOMER.userId
      );
    }

    const newOrder: OrderData = {
      orderId,
      customerId: INITIAL_CUSTOMER.userId,
      customerName: INITIAL_CUSTOMER.name,
      customerPhone: INITIAL_CUSTOMER.phone,
      merchantId: merchant.merchantId,
      merchantName: merchant.storeName,
      merchantStatus: 'PENDING_CONFIRMATION',
      items,
      foodSubtotal: shoppingSubtotal,
      shoppingSubtotal,
      merchantNotes: notes,
      deliveryAddressNote,
      origin,
      destination,
      distanceKm,
      durationMins,
      baseFare: deliveryFare.baseFare,
      distanceFare: deliveryFare.distanceFare,
      appFee: deliveryFare.appFee,
      totalFare,
      serviceType: 'SHOPPING',
      status: 'SEARCHING',
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      createdAt: Date.now(),
      routeCoordinates
    };

    this.state.orders[orderId] = newOrder;
    this.notify();
    return orderId;
  }

  // --- LIVE CHAT PENJUAL & PELANGGAN ---
  public sendChatMessage(
    merchantId: string,
    msg: Omit<ChatMessage, 'id' | 'timestamp'>
  ) {
    if (!this.state.chats) {
      this.state.chats = {};
    }
    if (!this.state.chats[merchantId]) {
      this.state.chats[merchantId] = [];
    }

    const newChat: ChatMessage = {
      ...msg,
      id: 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: Date.now()
    };

    this.state.chats[merchantId].push(newChat);
    this.notify();

    // Auto-reply dari penjual jika dikirim oleh pelanggan untuk interaksi realistis
    if (msg.sender === 'customer') {
      setTimeout(() => {
        const merchant = this.state.merchants[merchantId];
        const storeName = merchant?.storeName || 'Penjual Mitra';
        const replyText = msg.productName
          ? `Halo kak! Terima kasih sudah menghubungi ${storeName}. Stok untuk "${msg.productName}" saat ini READY dan siap dikirim via Ojek Express hari ini. Silakan langsung pesan ya kak! 🙏`
          : `Halo kak! Ada yang bisa kami bantu dari toko ${storeName}? Kami siap melayani pesanan Anda secepatnya. 😊`;

        const replyChat: ChatMessage = {
          id: 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5),
          merchantId,
          orderId: msg.orderId,
          sender: 'merchant',
          senderName: storeName,
          text: replyText,
          timestamp: Date.now(),
          productId: msg.productId,
          productName: msg.productName
        };

        if (this.state.chats && this.state.chats[merchantId]) {
          this.state.chats[merchantId].push(replyChat);
          this.notify();
        }
      }, 1000);
    }
  }

  public getMerchantChats(merchantId: string): ChatMessage[] {
    return this.state.chats?.[merchantId] || [];
  }

  public updateDriverLocation(driverId: string, loc: Partial<DriverLocation>) {
    if (this.state.drivers[driverId]) {
      this.state.drivers[driverId].location = {
        ...this.state.drivers[driverId].location,
        ...loc,
        updatedAt: Date.now()
      };
      this.notify();
    }
  }

  // --- SIMULATED FusedLocationProviderClient (Background loop every 2-3 sec) ---
  public startGpsSimulation(orderId: string, driverId: string) {
    this.stopGpsSimulation();

    let stepIndex = 0;
    this.gpsIntervalId = setInterval(() => {
      const order = this.state.orders[orderId];
      const driver = this.state.drivers[driverId];
      if (!order || !driver || order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        this.stopGpsSimulation();
        return;
      }

      // If heading to pickup, move towards origin
      const targetPoint = order.tripStep === 'HEADING_TO_PICKUP' || order.tripStep === 'ARRIVED_AT_PICKUP'
        ? order.origin
        : order.destination;

      const currentLat = driver.location.lat;
      const currentLng = driver.location.lng;

      // Move 10% closer each tick
      const dLat = (targetPoint.lat - currentLat) * 0.18;
      const dLng = (targetPoint.lng - currentLng) * 0.18;

      const newLat = currentLat + dLat;
      const newLng = currentLng + dLng;

      // Calculate approximate heading angle
      const heading = Math.atan2(dLng, dLat) * (180 / Math.PI);

      this.updateDriverLocation(driverId, {
        lat: Number(newLat.toFixed(6)),
        lng: Number(newLng.toFixed(6)),
        heading: Math.round(heading),
        accuracyMeters: 3.5 + Math.random() * 2
      });

      stepIndex++;
    }, 2500); // 2.5 seconds loop
  }

  public stopGpsSimulation() {
    if (this.gpsIntervalId) {
      clearInterval(this.gpsIntervalId);
      this.gpsIntervalId = null;
    }
  }

  public resetAll() {
    this.stopGpsSimulation();
    this.state = {
      users: {
        [INITIAL_CUSTOMER.userId]: { ...INITIAL_CUSTOMER }
      },
      drivers: {
        [INITIAL_DRIVER.driverId]: { ...INITIAL_DRIVER }
      },
      merchants: {
        [INITIAL_MERCHANT.merchantId]: { ...INITIAL_MERCHANT },
        [INITIAL_FOOD_MERCHANT_2.merchantId]: { ...INITIAL_FOOD_MERCHANT_2 },
        [INITIAL_CAFE_MERCHANT.merchantId]: { ...INITIAL_CAFE_MERCHANT },
        [INITIAL_GOODS_MERCHANT.merchantId]: { ...INITIAL_GOODS_MERCHANT }
      },
      orders: {},
      chats: {}
    };
    try {
      localStorage.removeItem('ojek_mvp_rtdb_state');
    } catch {
      // ignore
    }
    this.notify();
  }
}

export const realtimeStore = new RealtimeDatabaseStore();
