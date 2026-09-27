import React, { useState, useMemo, useEffect } from 'react';
import {
  LocationPoint,
  OrderData,
  CarTierType,
  CarFareBreakdown,
  DriverLocation
} from '../types';
import { InteractiveMap } from './InteractiveMap';
import { JAKARTA_LOCATIONS, calculateDistanceKm } from '../data/mockLocations';
import { realtimeStore } from '../services/realtimeStore';
import { CustomerTopUpModal } from './CustomerTopUpModal';
import {
  Car,
  MapPin,
  Navigation,
  ArrowLeft,
  Search,
  Crosshair,
  ShieldCheck,
  Clock,
  Banknote,
  Wallet,
  QrCode,
  Building2,
  Users,
  Briefcase,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  Star,
  Zap,
  Tag,
  RotateCcw,
  Compass,
  AlertCircle
} from 'lucide-react';

interface CustomerCarProps {
  customerLocation?: LocationPoint;
  activeOrder?: OrderData | null;
  driverLocation?: DriverLocation;
  onBackToHome?: () => void;
  onOrderCreated?: (orderId: string) => void;
}

// Rekomendasi Titik Penjemputan / Lobi Khusus Mobil
const CAR_LOBBY_PRESETS = [
  'Lobi Utama (Main Lobby)',
  'Lobi Barat (Drop-off Pintu 1)',
  'Lobi Timur (Pintu Selatan)',
  'Pos Satpam Gerbang Utama',
  'Area Drop-off Penumpang',
  'Shelter Taksi & Ojek Online'
];

// Rekomendasi Lokasi Populer Tujuan Ojek Car
const POPULAR_CAR_DESTINATIONS: (LocationPoint & { category: string; tag: string })[] = [
  {
    name: 'Bandara Soekarno-Hatta (Terminal 3)',
    address: 'Pajang, Benda, Kota Tangerang, Banten',
    lat: -6.1275,
    lng: 106.6537,
    category: 'Bandara',
    tag: 'Tersedia Tol Langsung'
  },
  {
    name: 'Bandara Halim Perdanakusuma',
    address: 'Jl. Halim Perdana Kusuma, Makasar, Jakarta Timur',
    lat: -6.2655,
    lng: 106.8906,
    category: 'Bandara',
    tag: 'Rute Cepat'
  },
  {
    name: 'Grand Indonesia Mall',
    address: 'Jl. M.H. Thamrin No.1, Kebon Melati, Jakarta Pusat',
    lat: -6.1950,
    lng: 106.8208,
    category: 'Pusat Belanja',
    tag: 'Area Drop-off Lobi'
  },
  {
    name: 'Senayan City Mall',
    address: 'Jl. Asia Afrika No.19, Gelora, Tanah Abang, Jakarta Pusat',
    lat: -6.2272,
    lng: 106.7975,
    category: 'Pusat Belanja',
    tag: 'Lobi Selatan'
  },
  {
    name: 'Stasiun Kereta Cepat Halim (Whoosh)',
    address: 'Halim Perdanakusuma, Makasar, Jakarta Timur',
    lat: -6.2442,
    lng: 106.8837,
    category: 'Stasiun',
    tag: 'Pick-up Bay'
  },
  {
    name: 'Pacific Place Mall (SCBD)',
    address: 'Jl. Jend. Sudirman Kav 52-53, Senayan, Jakarta Selatan',
    lat: -6.2244,
    lng: 106.8097,
    category: 'Perkantoran',
    tag: 'Bebas Ganjil Genap'
  }
];

// Pilihan Tipe Armada Ojek Car
const CAR_TIERS = [
  {
    id: 'CAR_REGULER' as CarTierType,
    name: 'Car Reguler',
    badge: 'Paling Hemat',
    capacity: '1 - 4 Orang',
    luggage: 'Maks 2 Koper Sedang',
    models: 'Avanza, Brio, Calya, Sigra',
    baseFare: 15000,
    perKmRate: 4500,
    description: 'Mobil kompak & MPV nyaman ber-AC dingin untuk perjalanan harian hemat.'
  },
  {
    id: 'CAR_XL' as CarTierType,
    name: 'Car XL 6-Seater',
    badge: 'Keluarga & Rombongan',
    capacity: '1 - 6 Orang',
    luggage: 'Maks 4 Koper Besar',
    models: 'Innova Reborn, Xpander, Stargazer',
    baseFare: 22000,
    perKmRate: 6200,
    description: 'Kabin ekstra luas 3 baris kursi, ideal untuk bepergian bersama keluarga & barang banyak.'
  },
  {
    id: 'CAR_COMFORT' as CarTierType,
    name: 'Car Prioritas Comfort',
    badge: 'Eksekutif VIP',
    capacity: '1 - 4 Orang',
    luggage: 'Maks 3 Koper',
    models: 'Innova Zenix, HR-V, Camry',
    baseFare: 28000,
    perKmRate: 7500,
    description: 'Armada premium terbaru, driver bintang 4.9+, bebas ganjil-genap & wangi.'
  }
];

export const CustomerCar: React.FC<CustomerCarProps> = ({
  customerLocation,
  activeOrder,
  driverLocation,
  onBackToHome,
  onOrderCreated
}) => {
  // 1. Lokasi Penjemputan & Tujuan
  const defaultOrigin: LocationPoint = customerLocation || JAKARTA_LOCATIONS[0];
  const defaultDestination: LocationPoint = JAKARTA_LOCATIONS[2]; // Grand Indonesia

  const [origin, setOrigin] = useState<LocationPoint>(defaultOrigin);
  const [destination, setDestination] = useState<LocationPoint>(defaultDestination);
  const [pickupLobby, setPickupLobby] = useState<string>(CAR_LOBBY_PRESETS[0]);
  const [pickupNote, setPickupNote] = useState<string>('');
  const [destinationNote, setDestinationNote] = useState<string>('');

  // Status GPS Sensor Real-time
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>('±8 meter (Satelit Fused)');
  const [gpsLocked, setGpsLocked] = useState<boolean>(true);

  // Modal Picker Lokasi
  const [searchPickerField, setSearchPickerField] = useState<'origin' | 'destination' | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 2. Armada & Preferensi Rute
  const [selectedTier, setSelectedTier] = useState<CarTierType>('CAR_REGULER');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [useTollRoad, setUseTollRoad] = useState<boolean>(true);
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [promoVoucher, setPromoVoucher] = useState<'NONE' | 'CARHEMAT10K' | 'DISKONBANDARA'>('CARHEMAT10K');

  // 3. Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DIGITAL_WALLET' | 'QRIS' | 'BANK_TRANSFER'>('DIGITAL_WALLET');
  const [cashChangeOption, setCashChangeOption] = useState<'Uang Pas' | 'Bawa Rp 50.000' | 'Bawa Rp 100.000' | 'Bawa Rp 200.000'>('Uang Pas');
  const [ojekPayBalance, setOjekPayBalance] = useState<number>(() => realtimeStore.getCustomerWallet());
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  // Sync wallet balance in real-time
  useEffect(() => {
    const unsub = realtimeStore.subscribe(() => {
      setOjekPayBalance(realtimeStore.getCustomerWallet());
    });
    return () => unsub();
  }, []);

  // Status Loading Form
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [tripRating, setTripRating] = useState<number>(5);

  // Update origin if parent changes customer location
  useEffect(() => {
    if (customerLocation && !activeOrder) {
      setOrigin(customerLocation);
    }
  }, [customerLocation, activeOrder]);

  // Fungsi Deteksi GPS Real-Time
  const handleDetectCurrentGps = () => {
    setIsGpsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);
          setGpsAccuracy(`±${accuracy} meter (Presisi Tinggi)`);
          setGpsLocked(true);

          // Update origin with actual coordinates
          setOrigin({
            name: 'Lokasi GPS Saya Saat Ini',
            address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)} (Terverifikasi Fused Location)`,
            lat,
            lng
          });
          setIsGpsLocating(false);
        },
        (error) => {
          // Fallback realistis di pusat Jakarta jika browser sandbox / permission ditolak
          setTimeout(() => {
            const fallbackLoc = JAKARTA_LOCATIONS[0]; // Stasiun Gambir
            setOrigin({
              name: 'Stasiun Gambir (GPS Terdeteksi)',
              address: fallbackLoc.address,
              lat: fallbackLoc.lat,
              lng: fallbackLoc.lng
            });
            setGpsAccuracy('±12 meter (Estimasi Seluler)');
            setGpsLocked(true);
            setIsGpsLocating(false);
          }, 600);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsGpsLocating(false);
    }
  };

  // Swap Titik Jemput & Tujuan
  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Kalkulasi Jarak Rute (Geodetic with road factor 1.35x for cars)
  const distanceKm = useMemo(() => {
    const straightDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const roadDist = Math.max(1.8, Math.round(straightDist * 1.35 * 10) / 10);
    return roadDist;
  }, [origin, destination]);

  // Estimasi Waktu Tempuh Mobil
  const durationMins = useMemo(() => {
    // Lewat tol lebih cepat
    const minsPerKm = useTollRoad ? 2.6 : 4.0;
    return Math.max(12, Math.round(distanceKm * minsPerKm));
  }, [distanceKm, useTollRoad]);

  // Kalkulasi Rincian Tarif (Fare Breakdown)
  const fareBreakdown: CarFareBreakdown = useMemo(() => {
    const tierConfig = CAR_TIERS.find((t) => t.id === selectedTier) || CAR_TIERS[0];
    const baseFare = tierConfig.baseFare;
    const distanceFare = Math.round(distanceKm * tierConfig.perKmRate);
    const tollEstimate = useTollRoad ? (distanceKm > 10 ? 16500 : 10500) : 0;
    const appFee = 3000;
    const insuranceFee = includeInsurance ? 2000 : 0;

    let discount = 0;
    if (promoVoucher === 'CARHEMAT10K') {
      discount = 10000;
    } else if (promoVoucher === 'DISKONBANDARA') {
      discount = 15000;
    }

    const subtotal = baseFare + distanceFare + tollEstimate + appFee + insuranceFee;
    const totalFare = Math.max(tierConfig.baseFare, subtotal - discount);

    return {
      distanceKm,
      baseFare,
      distanceFare,
      tierMultiplier: 1.0,
      tollEstimate,
      insuranceFee,
      appFee,
      discount,
      totalFare
    };
  }, [distanceKm, selectedTier, useTollRoad, includeInsurance, promoVoucher]);

  // Submit Pemesanan Ojek Car
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin.name === destination.name) {
      alert('Titik penjemputan dan tujuan tidak boleh sama!');
      return;
    }

    if (paymentMethod === 'DIGITAL_WALLET' && ojekPayBalance < fareBreakdown.totalFare) {
      setShowTopUpModal(true);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderId = realtimeStore.createCarOrder({
        origin: {
          ...origin,
          address: `${origin.address} [Patokan: ${pickupLobby}${pickupNote ? ` - ${pickupNote}` : ''}]`
        },
        destination: {
          ...destination,
          address: destinationNote ? `${destination.address} (Catatan: ${destinationNote})` : destination.address
        },
        carTier: selectedTier,
        carFareBreakdown: fareBreakdown,
        pickupLobbyLandmark: `${pickupLobby}${pickupNote ? `: ${pickupNote}` : ''}`,
        useTollRoad,
        passengerCount,
        luggageNotes: destinationNote,
        cashChangeNote: paymentMethod === 'CASH' ? cashChangeOption : undefined,
        paymentMethod
      });

      // Deduct balance if digital wallet
      if (paymentMethod === 'DIGITAL_WALLET') {
        realtimeStore.deductCustomerBalance(fareBreakdown.totalFare);
      }

      setIsSubmitting(false);
      if (onOrderCreated) {
        onOrderCreated(orderId);
      }
    }, 500);
  };

  // Batalkan Pesanan
  const handleCancelOrder = () => {
    if (activeOrder) {
      realtimeStore.cancelOrder(activeOrder.orderId);
    }
  };

  // Filter daftar lokasi pencarian
  const filteredLocations = useMemo(() => {
    if (!searchKeyword.trim()) return JAKARTA_LOCATIONS;
    return JAKARTA_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [searchKeyword]);

  // TAMPILAN 1: STATUS REALTIME SAAT ORDER AKTIF (SEARCHING, ON TRIP, DLL)
  if (activeOrder && activeOrder.serviceType === 'CAR' && activeOrder.status !== 'CANCELLED') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden pb-16 bg-slate-50">
        {/* Map Header */}
        <div className="relative h-64 sm:h-72 w-full shrink-0 border-b border-slate-200">
          <InteractiveMap
            origin={activeOrder.origin}
            destination={activeOrder.destination}
            driverLocation={driverLocation}
            tripStep={activeOrder.tripStep}
          />

          {/* Floating Return Button */}
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs text-slate-700 font-bold hover:text-blue-700 hover:bg-white transition-all z-10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </button>
          )}

          {/* Badge Armada Mobil */}
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10 text-xs font-black uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" />
            <span>{activeOrder.carTier === 'CAR_XL' ? 'Car XL (6-Seat)' : activeOrder.carTier === 'CAR_COMFORT' ? 'Car Comfort VIP' : 'Car Reguler'}</span>
          </div>
        </div>

        {/* Scrollable Tracking Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {/* Status Banner */}
          {activeOrder.status === 'SEARCHING' && (
            <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                <div className="w-14 h-14 rounded-full border-3 border-blue-600 border-t-transparent animate-spin"></div>
                <Car className="w-6 h-6 text-blue-600 absolute" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Mencari Driver Ojek Car Terdekat...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Menghubungkan pesanan Anda ke mitra driver mobil ber-AC di sekitar {activeOrder.origin.name.split(',')[0]}
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 text-blue-600 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Estimasi Jemput: ~3-5 Menit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Armada Terverifikasi
                </span>
              </div>
              <button
                onClick={handleCancelOrder}
                className="w-full py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              >
                Batalkan Pesanan Mobil
              </button>
            </div>
          )}

          {/* DRIVER DITEMUKAN & AKTIF */}
          {(activeOrder.status === 'ACCEPTED' || activeOrder.status === 'ON_TRIP') && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={activeOrder.driverVehicle?.includes('Innova') ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'}
                    alt="Driver Mobil"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900">{activeOrder.driverName || 'Bpk. Bambang Pamungkas'}</h4>
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                        <Star className="w-3 h-3 fill-current" /> 4.92
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeOrder.driverVehicle || 'Toyota Avanza Veloz (Putih)'} • <span className="font-mono font-bold text-slate-800">{activeOrder.driverPlate || 'B 1829 UVD'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => alert(`Menghubungi driver ${activeOrder.driverName || 'Bpk. Bambang'} di ${activeOrder.driverPhone || '0812-3456-7890'}`)}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                    title="Telepon Driver"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert('Fitur Chat Cepat: "Halo Pak, saya sudah menunggu di lobi utama depan lobi lift!"')}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                    title="Chat Driver"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Perjalanan */}
              <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                  Status Perjalanan:
                </span>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span>
                    {activeOrder.tripStep === 'HEADING_TO_PICKUP' && 'Driver sedang menuju titik penjemputan Anda'}
                    {activeOrder.tripStep === 'ARRIVED_AT_PICKUP' && 'Driver sudah tiba di titik lobi penjemputan!'}
                    {activeOrder.tripStep === 'ON_THE_WAY' && 'Dalam perjalanan nyaman menuju lokasi tujuan'}
                    {activeOrder.tripStep === 'ARRIVED_AT_DESTINATION' && 'Tiba di lokasi tujuan'}
                    {!activeOrder.tripStep && 'Driver terkonfirmasi & sedang bersiap'}
                  </span>
                </p>
              </div>

              {/* Titik Patokan Lobi */}
              {activeOrder.pickupLobbyLandmark && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Titik Temu Lobi:</span>
                    <span className="font-bold text-slate-800">{activeOrder.pickupLobbyLandmark}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PERJALANAN SELESAI */}
          {activeOrder.status === 'COMPLETED' && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md text-center space-y-3.5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Perjalanan Ojek Car Selesai!</h3>
                <p className="text-xs text-slate-500 mt-1">Terima kasih telah menggunakan layanan mobil ber-AC Ojek Car.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center font-bold">
                <span className="text-slate-600">Total Tarif Dibayar:</span>
                <span className="font-mono text-emerald-600 text-sm font-black">
                  Rp {activeOrder.totalFare.toLocaleString('id-ID')} ({activeOrder.paymentMethod})
                </span>
              </div>

              {/* Form Rating Driver */}
              {!ratingSubmitted ? (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block">Beri Nilai Kenyamanan Driver:</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTripRating(star)}
                        className={`p-1 text-2xl transition-transform hover:scale-110 ${star <= tripRating ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setRatingSubmitted(true);
                      alert('Terima kasih atas penilaian Anda!');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Kirim Penilaian ({tripRating} Bintang)
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                  ✓ Ulasan & Bintang 5 Berhasil Disimpan!
                </div>
              )}
            </div>
          )}

          {/* Rincian Rute & Pembayaran */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
            <div className="flex justify-between items-center font-bold pb-2 border-b border-slate-100">
              <span className="text-slate-500">Rincian Perjalanan</span>
              <span className="text-blue-600 font-mono">{activeOrder.distanceKm} km • ~{activeOrder.durationMins} mnt</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                <span className="text-slate-800 line-clamp-1"><strong>Jemput:</strong> {activeOrder.origin.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1"></span>
                <span className="text-slate-800 line-clamp-1"><strong>Tujuan:</strong> {activeOrder.destination.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN 2: FORM PEMESANAN UTAMA OJEK CAR (MULAI DARI GPS, RUTE, HARGA & PEMBAYARAN)
  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-16 bg-slate-50">
      {/* Map Header with Interactive Route Preview */}
      <div className="relative h-60 sm:h-64 w-full shrink-0 border-b border-slate-200">
        <InteractiveMap
          origin={origin}
          destination={destination}
          driverLocation={driverLocation}
        />

        {/* Floating Return Button */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs text-slate-700 font-bold hover:text-blue-700 hover:bg-white transition-all z-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
        )}

        {/* Floating Service Badge */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10 text-xs font-black tracking-wide">
          <Car className="w-3.5 h-3.5" />
          <span>OJEK CAR</span>
        </div>

        {/* Floating GPS Location Button on Map */}
        <button
          onClick={handleDetectCurrentGps}
          disabled={isGpsLocating}
          title="Kunci Posisi GPS Saya"
          className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 hover:border-blue-500 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs text-slate-800 font-bold hover:text-blue-700 transition-all z-10"
        >
          <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isGpsLocating ? 'animate-spin' : ''}`} />
          <span>{isGpsLocating ? 'Mendeteksi GPS...' : 'GPS Posisi Saya'}</span>
        </button>
      </div>

      {/* Main Scrollable Booking Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          {/* Header Card: Ojek Car Promo & Benefits */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-md shadow-blue-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider">Ojek Car Mobil Nyaman</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase">AC DINGIN</span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">
                Pilihan armada mobil terawat, tarif transparan, bebas ganjil-genap.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Car className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* BAGIAN 1: PENENTUAN TITIK PENJEMPUTAN & TUJUAN DENGAN GPS */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Rute Penjemputan & Tujuan</span>
              </span>
              <button
                type="button"
                onClick={handleDetectCurrentGps}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Crosshair className="w-3 h-3" />
                <span>Gunakan GPS Akurat</span>
              </button>
            </div>

            {/* Kotak Input Rute dengan Garis Penghubung */}
            <div className="relative pl-6 space-y-3">
              {/* Garis vertikal dekoratif rute */}
              <div className="absolute left-2.5 top-3.5 bottom-3.5 w-0.5 bg-gradient-to-b from-emerald-500 via-slate-300 to-rose-500"></div>

              {/* Titik Penjemputan (Pickup) */}
              <div className="relative">
                <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <span>Titik Jemput (Pick-up)</span>
                      {gpsLocked && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                          GPS Live
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchPickerField('origin')}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Ubah Lokasi
                    </button>
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5 truncate">{origin.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{origin.address}</div>
                </div>
              </div>

              {/* Tombol Swap Lokasi Cepat */}
              <div className="flex justify-end pr-2 -my-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 transition-all"
                  title="Tukar Titik Jemput dan Tujuan"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Tukar Titik</span>
                </button>
              </div>

              {/* Titik Tujuan (Destination) */}
              <div className="relative">
                <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100"></div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-500 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-700">Tujuan Pengantaran (Drop-off)</span>
                    <button
                      type="button"
                      onClick={() => setSearchPickerField('destination')}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Cari Tujuan
                    </button>
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5 truncate">{destination.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{destination.address}</div>
                </div>
              </div>
            </div>

            {/* Pilihan Khusus Mobil: Patokan Titik Lobi / Pick-up Bay */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Titik Temu Lobi Mobil:</span>
                <span className="text-[9px] text-slate-400 font-normal">Memudahkan driver parkir/jemput</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CAR_LOBBY_PRESETS.map((lobby) => (
                  <button
                    key={lobby}
                    type="button"
                    onClick={() => setPickupLobby(lobby)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      pickupLobby === lobby
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {lobby}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Catatan penjemputan (Cth: Dekat tiang 4 lobi, baju kemeja biru)..."
                className="w-full px-3 py-1.5 text-[11px] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Modal Picker Pencarian Lokasi */}
          {searchPickerField && (
            <div className="p-3.5 bg-white rounded-2xl border-2 border-blue-500 space-y-2.5 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-700 uppercase">
                  Pilih {searchPickerField === 'origin' ? 'Titik Penjemputan' : 'Lokasi Tujuan Mobil'}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPickerField(null);
                    setSearchKeyword('');
                  }}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Input Pencarian */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Cari gedung, stasiun, mall, atau bandara..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              {/* Pilihan Cepat Destinasi Populer Mobil */}
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-slate-400 block px-1">Rekomendasi Populer:</span>
                {POPULAR_CAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => {
                      if (searchPickerField === 'origin') {
                        setOrigin(dest);
                      } else {
                        setDestination(dest);
                      }
                      setSearchPickerField(null);
                      setSearchKeyword('');
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs hover:bg-blue-50 border border-slate-100 hover:border-blue-200 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{dest.name}</div>
                      <div className="text-[10px] text-slate-500">{dest.address}</div>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md shrink-0">
                      {dest.category}
                    </span>
                  </button>
                ))}

                {/* Hasil Filter Lokasi */}
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      if (searchPickerField === 'origin') {
                        setOrigin(loc);
                      } else {
                        setDestination(loc);
                      }
                      setSearchPickerField(null);
                      setSearchKeyword('');
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                  >
                    <div className="font-bold text-slate-900">{loc.name}</div>
                    <div className="text-[10px] text-slate-500">{loc.address}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BAGIAN 2: ESTIMASI RUTE, PREFERENSI JALAN TOL & PILIHAN ARMADA MOBIL */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Kalkulasi Rute & Estimasi
              </span>
              <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {distanceKm} km • ~{durationMins} mnt
              </span>
            </div>

            {/* Toggle Lewat Jalan Tol */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  TOL
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Lewat Jalan Tol Bebas Hambatan</div>
                  <div className="text-[10px] text-slate-500">Estimasi lebih cepat ~10-15 menit (Tol Dalam Kota / Tol Bandara)</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTollRoad}
                  onChange={(e) => setUseTollRoad(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Selector Tipe Armada Ojek Car (3 Pilihan) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Pilih Tipe Armada Ojek Car:</span>
              <div className="grid grid-cols-1 gap-2">
                {CAR_TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  // Kalkulasi estimasi harga masing-masing armada untuk perbandingan langsung
                  const tierDistanceFare = Math.round(distanceKm * tier.perKmRate);
                  const tierToll = useTollRoad ? 10500 : 0;
                  const tierTotal = tier.baseFare + tierDistanceFare + tierToll + 3000 + (includeInsurance ? 2000 : 0) - (promoVoucher === 'CARHEMAT10K' ? 10000 : 0);

                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{tier.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                              {tier.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Kapasitas: <strong className="text-slate-700">{tier.capacity}</strong> • {tier.models}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-blue-700 block">
                          Rp {tierTotal.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-slate-400">Total Bersih</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jumlah Penumpang & Catatan Bagasi */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Jumlah Penumpang:</span>
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPassengerCount(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      passengerCount === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BAGIAN 3: RINCIAN KALKULASI HARGA & VOUCHER PROMO */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Rincian Tarif Ojek Car</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tarif Pasti Transparan
              </span>
            </div>

            {/* Rincian Komponen Tarif */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tarif Dasar ({selectedTier === 'CAR_XL' ? 'Car XL' : selectedTier === 'CAR_COMFORT' ? 'Car Comfort' : 'Car Reguler'}):</span>
                <span className="font-mono text-slate-900 font-medium">Rp {fareBreakdown.baseFare.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Jarak Tempuh ({distanceKm} km):</span>
                <span className="font-mono text-slate-900 font-medium">Rp {fareBreakdown.distanceFare.toLocaleString('id-ID')}</span>
              </div>
              {useTollRoad && (
                <div className="flex justify-between text-blue-700">
                  <span>Estimasi Biaya Jalan Tol:</span>
                  <span className="font-mono font-bold">Rp {fareBreakdown.tollEstimate.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Biaya Layanan Aplikasi:</span>
                <span className="font-mono text-slate-900 font-medium">Rp {fareBreakdown.appFee.toLocaleString('id-ID')}</span>
              </div>

              {/* Toggle Asuransi Perjalanan */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Asuransi Penumpang Jasa Raharja:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 font-medium">Rp 2.000</span>
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Potongan Promo Voucher */}
              {fareBreakdown.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Potongan Promo ({promoVoucher}):</span>
                  <span className="font-mono">- Rp {fareBreakdown.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Pilihan Kode Voucher Hemat */}
            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
              <span className="text-blue-900 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Voucher Promo:</span>
              </span>
              <select
                value={promoVoucher}
                onChange={(e) => setPromoVoucher(e.target.value as any)}
                className="bg-white px-2.5 py-1 rounded-lg border border-blue-300 text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CARHEMAT10K">CARHEMAT10K (Hemat Rp 10.000)</option>
                <option value="DISKONBANDARA">DISKONBANDARA (Hemat Rp 15.000)</option>
                <option value="NONE">Tanpa Voucher</option>
              </select>
            </div>

            {/* Total Tagihan Akhir */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Tagihan Ojek Car:
                </span>
                <span className="text-xl font-black text-blue-700 font-mono">
                  Rp {fareBreakdown.totalFare.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">
                Termasuk PPN & Jasa
              </span>
            </div>
          </div>

          {/* BAGIAN 4: METODE PEMBAYARAN LENGKAP */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Metode Pembayaran</span>
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                {paymentMethod === 'CASH' && 'Bayar Tunai ke Driver'}
                {paymentMethod === 'DIGITAL_WALLET' && 'Saldo OjekPay'}
                {paymentMethod === 'QRIS' && 'QRIS Instan'}
                {paymentMethod === 'BANK_TRANSFER' && 'Virtual Account'}
              </span>
            </div>

            {/* Opsi 1: Saldo Digital OjekPay */}
            <label
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'DIGITAL_WALLET'
                  ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'DIGITAL_WALLET'}
                  onChange={() => setPaymentMethod('DIGITAL_WALLET')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Saldo OjekPay</span>
                    {ojekPayBalance >= fareBreakdown.totalFare ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                        CUKUP
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                        KURANG
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    Saldo Aktif: <strong className="text-slate-900">Rp {ojekPayBalance.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTopUpModal(true);
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-xs hover:bg-blue-50 transition-colors"
              >
                + Top Up
              </button>
            </label>

            {/* Opsi 2: Bayar Tunai (Cash ke Driver) */}
            <label
              className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                paymentMethod === 'CASH'
                  ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Tunai (Bayar ke Driver)</span>
                    <span className="text-[10px] text-slate-500">Bayar saat tiba di tujuan mobil</span>
                  </div>
                </div>
                <Banknote className="w-4 h-4 text-slate-500" />
              </div>

              {/* Pilihan Uang Pas / Kembalian jika Tunai */}
              {paymentMethod === 'CASH' && (
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-600">Info Uang Tunai:</span>
                  <div className="flex gap-1.5">
                    {(['Uang Pas', 'Bawa Rp 50.000', 'Bawa Rp 100.000'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCashChangeOption(opt)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          cashChangeOption === opt ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </label>

            {/* Opsi 3: QRIS Dinamis */}
            <label
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'QRIS'
                  ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'QRIS'}
                  onChange={() => setPaymentMethod('QRIS')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">QRIS (Scan Bebas Admin)</span>
                  <span className="text-[10px] text-slate-500">GoPay, OVO, DANA, BCA, Mandiri, ShopeePay</span>
                </div>
              </div>
              <QrCode className="w-4 h-4 text-slate-600" />
            </label>

            {/* Opsi 4: Transfer Bank Virtual Account */}
            <label
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Transfer Virtual Account</span>
                  <span className="text-[10px] text-slate-500">BCA, Mandiri, BRI, BNI (Verifikasi Otomatis)</span>
                </div>
              </div>
              <Building2 className="w-4 h-4 text-slate-600" />
            </label>
          </div>

          {/* Tombol Aksi Submit Pemesanan Ojek Car */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Car className="w-5 h-5 text-white" />
            <span>
              {isSubmitting
                ? 'Menghubungkan ke Driver Mobil...'
                : `Pesan Ojek Car Sekarang (Rp ${fareBreakdown.totalFare.toLocaleString('id-ID')})`}
            </span>
          </button>
        </form>
      </div>

      {/* MODAL TOP UP SALDO OJEKPAY */}
      <CustomerTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
      />
    </div>
  );
};
