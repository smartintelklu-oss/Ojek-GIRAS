export type OrderStatus = 'IDLE' | 'SEARCHING' | 'ACCEPTED' | 'ON_TRIP' | 'COMPLETED' | 'CANCELLED';

export type TripLifecycleStep = 
  | 'HEADING_TO_PICKUP' 
  | 'ARRIVED_AT_PICKUP' 
  | 'ON_THE_WAY' 
  | 'ARRIVED_AT_DESTINATION' 
  | 'COMPLETED';

export type MerchantPreparationStatus = 
  | 'PENDING_CONFIRMATION' 
  | 'PREPARING' 
  | 'READY_FOR_PICKUP' 
  | 'PICKED_UP';

export interface LocationPoint {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  salesCount?: number;
  itemType?: 'FOOD' | 'GOODS';
  stock?: number;
  unit?: string;
  merchantId?: string;
  merchantName?: string;
}

export interface OrderItemDetail {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  itemType?: 'FOOD' | 'GOODS';
  imageUrl?: string;
}

export interface MerchantProfile {
  merchantId: string;
  name: string;
  storeName: string;
  category: string;
  address: string;
  phone: string;
  avatar: string;
  rating: number;
  isOpen: boolean;
  todayRevenue: number;
  todayOrdersCount: number;
  walletBalance: number;
  location: LocationPoint;
  menuItems: MenuItem[];
  businessType?: 'FOOD' | 'MART' | 'BOTH';
  storeDescription?: string;
  bannerImage?: string;
}

export interface ChatMessage {
  id: string;
  merchantId: string;
  orderId?: string;
  sender: 'customer' | 'merchant';
  senderName: string;
  text: string;
  timestamp: number;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

export interface TopUpTransaction {
  id: string;
  amount: number;
  adminFee: number;
  totalAmount: number;
  paymentMethod: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'E_WALLET' | 'RETAIL' | 'DEBIT_CARD' | 'OJEKPAY' | string;
  providerName: string;
  accountOrVaNumber: string;
  status: 'SUCCESS' | 'PENDING' | 'EXPIRED';
  timestamp: number;
  type?: 'TOPUP' | 'PAYMENT';
  orderId?: string;
  serviceType?: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  walletBalance?: number;
  topUpHistory?: TopUpTransaction[];
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number;
  updatedAt: number;
  accuracyMeters?: number;
}

export interface DriverProfile {
  driverId: string;
  name: string;
  phone: string;
  avatar: string;
  vehicleModel: string;
  plateNumber: string;
  rating: number;
  completedTrips: number;
  isOnline: boolean;
  currentOrderId: string | null;
  location: DriverLocation;
}

export interface PackageItemDetail {
  itemName: string;
  category: 'DOKUMEN' | 'MAKANAN' | 'PAKAIAN' | 'ELEKTRONIK' | 'PECAH_BELAH' | 'LAINNYA';
  weightKg: number;
  sizeCategory: 'KECIL' | 'SEDANG' | 'BESAR';
  specialHandling?: string[];
  specialNotes?: string;
  photoUrl?: string;
}

export interface ContactPerson {
  name: string;
  phone: string;
  addressNote?: string;
  landmark?: string;
}

export interface SendFareBreakdown {
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  weightSurcharge: number;
  insuranceFee: number;
  appFee: number;
  discount: number;
  totalFare: number;
}

export type CarTierType = 'CAR_REGULER' | 'CAR_XL' | 'CAR_COMFORT';

export interface CarFareBreakdown {
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  tierMultiplier: number;
  tollEstimate: number;
  insuranceFee: number;
  appFee: number;
  discount: number;
  totalFare: number;
}

export interface PackagePickupProof {
  photoUrl?: string;
  notes?: string;
  verifiedOtp?: string;
  timestamp: number;
}

export interface PackageDeliveryProof {
  receivedBy: string;
  relationship: string;
  photoUrl?: string;
  notes?: string;
  verifiedOtp?: string;
  timestamp: number;
}

export interface OrderData {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverVehicle?: string | null;
  driverPlate?: string | null;
  driverRating?: number;
  origin: LocationPoint;
  destination: LocationPoint;
  distanceKm: number;
  durationMins: number;
  baseFare: number;
  distanceFare: number;
  appFee: number;
  totalFare: number;
  serviceType?: 'RIDE' | 'CAR' | 'SEND' | 'FOOD' | 'SHOPPING' | string;
  packageType?: string;
  packageNotes?: string;
  // Paket Kilat (Send) Spesifik
  packageItem?: PackageItemDetail;
  senderContact?: ContactPerson;
  recipientContact?: ContactPerson;
  sendFareBreakdown?: SendFareBreakdown;
  payerType?: 'SENDER' | 'RECIPIENT';
  pickupOtp?: string;
  deliveryOtp?: string;
  packagePickupProof?: PackagePickupProof;
  packageDeliveryProof?: PackageDeliveryProof;
  // Ojek Car (Mobil) Spesifik
  carTier?: CarTierType;
  carFareBreakdown?: CarFareBreakdown;
  pickupLobbyLandmark?: string;
  useTollRoad?: boolean;
  passengerCount?: number;
  luggageNotes?: string;
  cashChangeNote?: string;
  // Mitra Penjual (Merchant) Specific Fields
  merchantId?: string;
  merchantName?: string;
  merchantStatus?: MerchantPreparationStatus;
  items?: OrderItemDetail[];
  foodSubtotal?: number;
  shoppingSubtotal?: number;
  merchantNotes?: string;
  deliveryAddressNote?: string;
  customerConfirmedReceived?: boolean;
  customerRating?: number;
  customerReview?: string;
  status: OrderStatus;
  tripStep?: TripLifecycleStep;
  paymentMethod: 'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER';
  paymentStatus: 'UNPAID' | 'PAID';
  createdAt: number;
  acceptedAt?: number;
  startedAt?: number;
  completedAt?: number;
  routeCoordinates?: { lat: number; lng: number }[];
}

export interface FirebaseDatabaseSchema {
  users: Record<string, UserProfile>;
  drivers: Record<string, DriverProfile>;
  merchants: Record<string, MerchantProfile>;
  orders: Record<string, OrderData>;
  chats?: Record<string, ChatMessage[]>;
}
