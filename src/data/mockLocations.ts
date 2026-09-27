import { LocationPoint, UserProfile, DriverProfile, MerchantProfile, SendFareBreakdown } from '../types';

export const JAKARTA_LOCATIONS: LocationPoint[] = [
  {
    name: 'Stasiun Gambir',
    address: 'Jl. Medan Merdeka Timur No.1, Gambir, Jakarta Pusat',
    lat: -6.1767,
    lng: 106.8306
  },
  {
    name: 'Monumen Nasional (Monas)',
    address: 'Gambir, Kecamatan Gambir, Kota Jakarta Pusat',
    lat: -6.1754,
    lng: 106.8272
  },
  {
    name: 'Grand Indonesia Mall',
    address: 'Jl. M.H. Thamrin No.1, Kebon Melati, Jakarta Pusat',
    lat: -6.1950,
    lng: 106.8208
  },
  {
    name: 'Stasiun MRT Bundaran HI',
    address: 'Jl. M.H. Thamrin, Menteng, Jakarta Pusat',
    lat: -6.1931,
    lng: 106.8231
  },
  {
    name: 'Senayan City Mall',
    address: 'Jl. Asia Afrika No.19, Gelora, Tanah Abang, Jakarta Pusat',
    lat: -6.2272,
    lng: 106.7975
  },
  {
    name: 'Pacific Place (SCBD)',
    address: 'Jl. Jend. Sudirman Kav 52-53, Senayan, Jakarta Selatan',
    lat: -6.2244,
    lng: 106.8097
  },
  {
    name: 'Stasiun Tebet',
    address: 'Jl. Lapangan Roos Raya, Tebet Timur, Jakarta Selatan',
    lat: -6.2265,
    lng: 106.8582
  },
  {
    name: 'Blok M Square',
    address: 'Jl. Melawai 5, Melawai, Kebayoran Baru, Jakarta Selatan',
    lat: -6.2443,
    lng: 106.7979
  }
];

export const INITIAL_CUSTOMER: UserProfile = {
  userId: 'usr_cust_8829',
  name: 'Rian Pratama',
  phone: '0812-9876-5432',
  email: 'rian.pratama@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  rating: 4.95,
  walletBalance: 250000,
  topUpHistory: [
    {
      id: 'TOPUP-98124',
      amount: 100000,
      adminFee: 0,
      totalAmount: 100000,
      paymentMethod: 'QRIS',
      providerName: 'QRIS Instant (GoPay/ShopeePay)',
      accountOrVaNumber: 'QRIS-DYNAMIC-0192',
      status: 'SUCCESS',
      timestamp: Date.now() - 3600000 * 24
    },
    {
      id: 'TOPUP-77215',
      amount: 150000,
      adminFee: 0,
      totalAmount: 150000,
      paymentMethod: 'VIRTUAL_ACCOUNT',
      providerName: 'BCA Virtual Account',
      accountOrVaNumber: '8801298765432100',
      status: 'SUCCESS',
      timestamp: Date.now() - 3600000 * 48
    }
  ]
};

export const INITIAL_DRIVER: DriverProfile = {
  driverId: 'drv_mitra_1092',
  name: 'Budi Santoso',
  phone: '0857-1122-3344',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  vehicleModel: 'Honda Vario 160 (Hitam)',
  plateNumber: 'B 4920 SAK',
  rating: 4.92,
  completedTrips: 1420,
  isOnline: true,
  currentOrderId: null,
  location: {
    lat: -6.1820,
    lng: 106.8250,
    heading: 45,
    updatedAt: Date.now(),
    accuracyMeters: 4.5
  }
};

export const INITIAL_MERCHANT: MerchantProfile = {
  merchantId: 'merch_resto_001',
  name: 'Ibu Hj. Siti Aminah',
  storeName: 'Ayam Geprek Sambal Bawang Juara Gambir',
  category: 'Aneka Ayam & Kuliner Pedas',
  businessType: 'FOOD',
  storeDescription: 'Pelopor ayam geprek cabai rawit pedas mantap di kawasan Gambir Jakarta Pusat.',
  bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  address: 'Jl. Medan Merdeka Timur No. 12, Gambir, Jakarta Pusat',
  phone: '0813-8877-6655',
  avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
  rating: 4.88,
  isOpen: true,
  todayRevenue: 485000,
  todayOrdersCount: 14,
  walletBalance: 1250000,
  location: {
    name: 'Ayam Geprek Juara Gambir',
    address: 'Jl. Medan Merdeka Timur No. 12, Gambir, Jakarta Pusat',
    lat: -6.1770,
    lng: 106.8290
  },
  menuItems: [
    {
      id: 'menu_01',
      name: 'Paket Ayam Geprek Sambal Bawang + Nasi',
      category: 'Makanan Utama',
      itemType: 'FOOD',
      price: 24000,
      description: 'Ayam krispi gurih digeprek dengan sambal bawang super pedas, nasi pulen hangat & lalapan timun kol.',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 142
    },
    {
      id: 'menu_02',
      name: 'Ayam Bakar Madu Pedas Manis Komplit',
      category: 'Makanan Utama',
      itemType: 'FOOD',
      price: 28000,
      description: 'Ayam bakar legit dengan baluran madu rempah bakar arang, sambal terasi matang & tahu tempe.',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 88
    },
    {
      id: 'menu_03',
      name: 'Mie Nyemek Spesial Telur Kornet Pedas',
      category: 'Mie & Pasta',
      itemType: 'FOOD',
      price: 18000,
      description: 'Mie kuah nyemek bumbu gurih kental berlimpah dengan telur orak-arik, potongan sawi & kornet sapi.',
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 110
    },
    {
      id: 'menu_04',
      name: 'Es Teh Manis Melati Jumbo 500ml',
      category: 'Minuman Segar',
      itemType: 'FOOD',
      price: 6000,
      description: 'Seduhan daun teh melati wangi dingin dengan gula tebu asli dalam cup jumbo 500ml.',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 230
    },
    {
      id: 'menu_05',
      name: 'Kopi Susu Gula Aren Kampung',
      category: 'Minuman Segar',
      itemType: 'FOOD',
      price: 15000,
      description: 'Espresso robusta mantap dipadu susu murni gurih creamy dan lelehan gula aren organik wangi.',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 95
    },
    {
      id: 'menu_06',
      name: 'Tahu & Tempe Goreng Krispi (Isi 4)',
      category: 'Camilan Tambahan',
      itemType: 'FOOD',
      price: 10000,
      description: 'Tahu dan tempe bumbu kuning renyah gurih hangat, disajikan dengan cabai rawit hijau segar.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 64
    }
  ]
};

export const INITIAL_FOOD_MERCHANT_2: MerchantProfile = {
  merchantId: 'merch_resto_002',
  name: 'Chef Andra Setiawan',
  storeName: 'Bebek Madura Bumbu Hitam Sabang',
  category: 'Aneka Bebek & Nasi Uduk',
  businessType: 'FOOD',
  storeDescription: 'Bebek goreng empuk gurih dengan limpahan bumbu rempah hitam khas Madura yang autentik dan pedas nikmat.',
  bannerImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  address: 'Jl. Sabang No. 18, Menteng, Jakarta Pusat',
  phone: '0812-3344-5566',
  avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
  rating: 4.95,
  isOpen: true,
  todayRevenue: 620000,
  todayOrdersCount: 19,
  walletBalance: 1780000,
  location: {
    name: 'Bebek Madura Bumbu Hitam Sabang',
    address: 'Jl. Sabang No. 18, Menteng, Jakarta Pusat',
    lat: -6.1850,
    lng: 106.8255
  },
  menuItems: [
    {
      id: 'food_b1',
      name: 'Paket Bebek Bumbu Hitam Komplit + Nasi Uduk',
      category: 'Makanan Utama',
      itemType: 'FOOD',
      price: 35000,
      description: 'Bebek goreng rempah gurih disiram bumbu hitam pekat khas Madura, nasi uduk gurih, serundeng, & lalapan segar.',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 184
    },
    {
      id: 'food_b2',
      name: 'Bebek Rica-Rica Kemangi Super Pedas',
      category: 'Makanan Utama',
      itemType: 'FOOD',
      price: 36000,
      description: 'Potongan bebek empuk berbalut kuah rica-rica merah cabai rawit pedas dan daun kemangi wangi.',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 92
    },
    {
      id: 'food_b3',
      name: 'Es Jeruk Peras Murni Selasih Segar',
      category: 'Minuman Segar',
      itemType: 'FOOD',
      price: 9000,
      description: 'Perasan jeruk pontianak manis asli dengan butiran biji selasih kenyal dan es batu segar.',
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 145
    },
    {
      id: 'food_b4',
      name: 'Kol Goreng Gurih Krispi',
      category: 'Camilan Tambahan',
      itemType: 'FOOD',
      price: 7000,
      description: 'Sayur kol segar digoreng renyah dengan taburan garam gurih dan bawang goreng.',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 110
    }
  ]
};

export const INITIAL_CAFE_MERCHANT: MerchantProfile = {
  merchantId: 'merch_cafe_003',
  name: 'Kevin Pratama',
  storeName: 'Kopi & Roti Kenangan Sabang',
  category: 'Kopi, Toast & Camilan',
  businessType: 'FOOD',
  storeDescription: 'Kopi racikan barista terbaik dan roti bakar brioche lembut dengan aneka topping lezat.',
  bannerImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
  address: 'Jl. H. Agus Salim No. 32, Kebon Sirih, Jakarta Pusat',
  phone: '0811-7788-9900',
  avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
  rating: 4.89,
  isOpen: true,
  todayRevenue: 510000,
  todayOrdersCount: 26,
  walletBalance: 1350000,
  location: {
    name: 'Kopi & Roti Kenangan Sabang',
    address: 'Jl. H. Agus Salim No. 32, Kebon Sirih, Jakarta Pusat',
    lat: -6.1830,
    lng: 106.8240
  },
  menuItems: [
    {
      id: 'cafe_01',
      name: 'Es Kopi Susu Aren Double Shot Creamy',
      category: 'Kopi & Minuman',
      itemType: 'FOOD',
      price: 18000,
      description: 'Espresso blend Arabika-Robusta harum, fresh milk gurih, gula aren alami kental dingin.',
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 310
    },
    {
      id: 'cafe_02',
      name: 'Roti Bakar Cokelat Keju Melted Brioche',
      category: 'Roti & Toast',
      itemType: 'FOOD',
      price: 22000,
      description: 'Roti brioche tebal empuk panggang mentega dengan filling cokelat lumer dan taburan keju cheddar parut tebal.',
      imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 165
    },
    {
      id: 'cafe_03',
      name: 'Croissant Butter Perancis Hangat Renyah',
      category: 'Camilan Tambahan',
      itemType: 'FOOD',
      price: 20000,
      description: 'Croissant lumer harum butter berlapis renyah keemasan, disajikan hangat.',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 140
    }
  ]
};

export const INITIAL_GOODS_MERCHANT: MerchantProfile = {
  merchantId: 'merch_mart_002',
  name: 'Bapak H. Hendra Wijaya',
  storeName: 'Toko Berkah Mart & Retail Gambir',
  category: 'Minimarket, Sembako & Elektronik',
  businessType: 'MART',
  storeDescription: 'Toko kelontong modern dan retail lengkap mitra terpercaya. Sembako murah, gadget, dan kebutuhan harian.',
  bannerImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
  address: 'Jl. Kebon Sirih Timur Dalam No. 45, Menteng, Jakarta Pusat',
  phone: '0812-9988-7744',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  rating: 4.92,
  isOpen: true,
  todayRevenue: 890000,
  todayOrdersCount: 22,
  walletBalance: 2450000,
  location: {
    name: 'Toko Berkah Mart Gambir',
    address: 'Jl. Kebon Sirih Timur Dalam No. 45, Menteng, Jakarta Pusat',
    lat: -6.1825,
    lng: 106.8335
  },
  menuItems: [
    {
      id: 'goods_01',
      name: 'Beras Pandan Wangi Super Premium 5 Kg',
      category: 'Sembako & Dapur',
      itemType: 'GOODS',
      price: 74000,
      stock: 28,
      unit: 'Karung 5kg',
      description: 'Beras pulen alami wangi pandan asli tanpa pemutih dan tanpa pengawet kimia. Kualitas jempolan.',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 210,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_02',
      name: 'Minyak Goreng Sania Pouch 2 Liter',
      category: 'Sembako & Dapur',
      itemType: 'GOODS',
      price: 36500,
      stock: 45,
      unit: 'Pouch 2L',
      description: 'Minyak kelapa sawit murni kualitas istimewa, jernih kuning keemasan untuk gorengan renyah sempurna.',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 340,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_03',
      name: 'Telur Ayam Negeri Fresh 1 Kg (Isi 16 Butir)',
      category: 'Sembako & Dapur',
      itemType: 'GOODS',
      price: 28000,
      stock: 35,
      unit: 'Kg',
      description: 'Telur ayam segar langsung dari peternakan Blitar, cangkang cokelat tebal & kuning telur padat bernutrisi.',
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 185,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_04',
      name: 'Gula Pasir Kristal Putih Gulaku 1 Kg',
      category: 'Sembako & Dapur',
      itemType: 'GOODS',
      price: 18500,
      stock: 50,
      unit: 'Pack 1kg',
      description: 'Gula tebu murni higienis tanpa pewarna, manis alami dan mudah larut untuk teh, kopi & kue.',
      imageUrl: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 160,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_05',
      name: 'Kabel Fast Charging Type-C 65W Braided',
      category: 'Elektronik & Gadget',
      itemType: 'GOODS',
      price: 35000,
      stock: 20,
      unit: 'Unit',
      description: 'Kabel data rajut nilon tebal anti putus, mendukung pengisian kilat Quick Charge & transfer data 480Mbps.',
      imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 95,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_06',
      name: 'Earphone Bluetooth TWS Wireless Mega Bass',
      category: 'Elektronik & Gadget',
      itemType: 'GOODS',
      price: 89000,
      stock: 14,
      unit: 'Set',
      description: 'TWS suara jernih bass mantap, latensi rendah untuk game/musik, baterai tahan 24 jam dengan display baterai.',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 78,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_07',
      name: 'Paket Sabun Cair Lifebuoy 450ml + Sikat Gigi',
      category: 'Perawatan & Kebersihan',
      itemType: 'GOODS',
      price: 26000,
      stock: 40,
      unit: 'Paket',
      description: 'Perlindungan total kuman untuk sekeluarga, wangi segar aktif plus sikat gigi bulu halus.',
      imageUrl: 'https://images.unsplash.com/photo-1608248597359-204128f73111?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 130,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_08',
      name: 'Snack Biskuit Cokelat Roma Kelapa & Wafer Kaleng',
      category: 'Snack & Minuman',
      itemType: 'GOODS',
      price: 22000,
      stock: 30,
      unit: 'Bungkus',
      description: 'Camilan biskuit gurih renyah kelapa asli berpadu wafer cokelat manis lezat untuk kumpul santai.',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 140,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_09',
      name: 'Kaos Polos Cotton Combed 30s Premium Hitam',
      category: 'Fashion & Pakaian',
      itemType: 'GOODS',
      price: 45000,
      stock: 18,
      unit: 'Pcs',
      description: 'Bahan 100% katun combed 30s adem halus menyerap keringat. Potongan unisex reguler fit.',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 62,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    },
    {
      id: 'goods_10',
      name: 'Deterjen Bubuk Daia Bunga 850g Harum Lembut',
      category: 'Perawatan & Kebersihan',
      itemType: 'GOODS',
      price: 19500,
      stock: 45,
      unit: 'Pack 850g',
      description: 'Busa melimpah cepat bersihkan noda membandel pakaian, semerbak bunga tahan seharian.',
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 190,
      merchantId: 'merch_mart_002',
      merchantName: 'Toko Berkah Mart Gambir'
    }
  ]
};

export const FARE_CONFIG = {
  BASE_FARE: 8000,      // Tarif dasar untuk 0 - 2 km pertama
  BASE_DISTANCE_KM: 2,  // Batas tarif dasar
  PER_KM_RATE: 2500,    // Biaya per kilometer setelah 2 km
  APP_SERVICE_FEE: 2000 // Biaya jasa aplikasi & asuransi perjalanan
};

export function calculateFare(distanceKm: number): {
  baseFare: number;
  distanceFare: number;
  appFee: number;
  totalFare: number;
} {
  const baseFare = FARE_CONFIG.BASE_FARE;
  const extraDistance = Math.max(0, distanceKm - FARE_CONFIG.BASE_DISTANCE_KM);
  const distanceFare = Math.round(extraDistance * FARE_CONFIG.PER_KM_RATE);
  const appFee = FARE_CONFIG.APP_SERVICE_FEE;
  const totalFare = baseFare + distanceFare + appFee;

  return {
    baseFare,
    distanceFare,
    appFee,
    totalFare
  };
}

// Konfigurasi Tarif Khusus Layanan Paket Kilat (Send)
export const SEND_FARE_CONFIG = {
  BASE_FARE: 10000,        // Tarif dasar pengiriman paket kilat (0 - 2 km)
  BASE_DISTANCE_KM: 2,
  PER_KM_RATE: 2500,       // Tarif per km setelah 2 km
  BASE_WEIGHT_KG: 2,       // Bobot standar gratis (hingga 2 kg)
  WEIGHT_SURCHARGE_PER_KG: 2000, // Tambahan per kg di atas 2 kg
  INSURANCE_FEE: 1500,     // Biaya proteksi/asuransi paket barang (jaminan s.d Rp 5.000.000)
  APP_SERVICE_FEE: 2000,   // Biaya layanan operasional aplikasi
  DEFAULT_DISCOUNT: 3000   // Potongan voucher hemat paket kilat
};

export function calculateSendFare(
  distanceKm: number,
  weightKg: number = 1,
  includeInsurance: boolean = true,
  applyDiscount: boolean = true
): SendFareBreakdown {
  const baseFare = SEND_FARE_CONFIG.BASE_FARE;
  const extraDistance = Math.max(0, distanceKm - SEND_FARE_CONFIG.BASE_DISTANCE_KM);
  const distanceFare = Math.round(extraDistance * SEND_FARE_CONFIG.PER_KM_RATE);

  const extraWeight = Math.max(0, Math.ceil(weightKg - SEND_FARE_CONFIG.BASE_WEIGHT_KG));
  const weightSurcharge = extraWeight * SEND_FARE_CONFIG.WEIGHT_SURCHARGE_PER_KG;

  const insuranceFee = includeInsurance ? SEND_FARE_CONFIG.INSURANCE_FEE : 0;
  const appFee = SEND_FARE_CONFIG.APP_SERVICE_FEE;
  const discount = applyDiscount ? SEND_FARE_CONFIG.DEFAULT_DISCOUNT : 0;

  const subtotal = baseFare + distanceFare + weightSurcharge + insuranceFee + appFee;
  const totalFare = Math.max(8000, subtotal - discount);

  return {
    distanceKm,
    baseFare,
    distanceFare,
    weightSurcharge,
    insuranceFee,
    appFee,
    discount,
    totalFare
  };
}

// Menghitung jarak Haversine kasar dalam KM
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;
  // Kalikan faktor belokan jalan perkotaan ~1.28
  const roadDist = Math.max(0.8, Number((rawDist * 1.28).toFixed(1)));
  return roadDist;
}
