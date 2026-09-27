import React, { useState, useEffect } from 'react';
import {
  DriverProfile,
  OrderData,
  TripLifecycleStep
} from '../types';
import { InteractiveMap } from './InteractiveMap';
import { INITIAL_DRIVER } from '../data/mockLocations';
import { realtimeStore } from '../services/realtimeStore';
import {
  Power,
  Navigation,
  MapPin,
  Clock,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Radio,
  Volume2,
  VolumeX,
  Phone,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Smartphone,
  Star,
  Package,
  Bike,
  Car,
  Utensils,
  Store,
  Camera,
  KeyRound,
  ShieldCheck,
  Scale,
  Box,
  Check,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

interface DriverAppProps {
  driver: DriverProfile;
  activeOrder: OrderData | null;
  pendingOrder: OrderData | null; // Order with status "SEARCHING"
  onToggleOnline: (isOnline: boolean) => void;
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onUpdateTripStep: (orderId: string, step: TripLifecycleStep) => void;
}

export const DriverApp: React.FC<DriverAppProps> = ({
  driver: driverProp,
  activeOrder,
  pendingOrder,
  onToggleOnline,
  onAcceptOrder,
  onRejectOrder,
  onUpdateTripStep
}) => {
  const driver = driverProp || INITIAL_DRIVER;
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);
  const [showIncomingModal, setShowIncomingModal] = useState<boolean>(false);

  // State Verifikasi Pengambilan Paket (Penjemputan)
  const [pickupOtpInput, setPickupOtpInput] = useState<string>('');
  const [pickupOtpError, setPickupOtpError] = useState<string | null>(null);
  const [pickupConditionNotes, setPickupConditionNotes] = useState<string>('Paket dalam kondisi baik, rapi, dan tersegel rapat.');
  const [pickupPhotoSimulated, setPickupPhotoSimulated] = useState<string>(
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=80'
  );

  // State Verifikasi Serah Terima Paket (Pengantaran di Tujuan)
  const [deliveryOtpInput, setDeliveryOtpInput] = useState<string>('');
  const [deliveryOtpError, setDeliveryOtpError] = useState<string | null>(null);
  const [deliveryReceivedBy, setDeliveryReceivedBy] = useState<string>('');
  const [deliveryRelationship, setDeliveryRelationship] = useState<string>('Penerima Langsung');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Paket telah diserahkan langsung dalam kondisi utuh.');
  const [deliveryPhotoSimulated, setDeliveryPhotoSimulated] = useState<string>(
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&auto=format&fit=crop&q=80'
  );

  // Reset / sync receiver name on activeOrder change
  useEffect(() => {
    if (activeOrder && activeOrder.serviceType === 'SEND') {
      if (activeOrder.recipientContact?.name) {
        setDeliveryReceivedBy(activeOrder.recipientContact.name);
      } else if (activeOrder.customerName) {
        setDeliveryReceivedBy(activeOrder.customerName);
      }
      setPickupOtpInput('');
      setDeliveryOtpInput('');
      setPickupOtpError(null);
      setDeliveryOtpError(null);
    }
  }, [activeOrder?.orderId]);

  // Handler Verifikasi Pengambilan Barang oleh Driver
  const handleConfirmPickup = () => {
    if (!activeOrder) return;
    if (!pickupOtpInput.trim()) {
      setPickupOtpError('Masukkan 4 digit kode OTP penjemputan dari pengirim!');
      return;
    }

    const result = realtimeStore.verifyPickupPackage(activeOrder.orderId, {
      photoUrl: pickupPhotoSimulated,
      notes: pickupConditionNotes,
      otp: pickupOtpInput
    });

    if (!result.success) {
      setPickupOtpError(result.message);
    } else {
      setPickupOtpError(null);
    }
  };

  // Handler Verifikasi Penerimaan Barang oleh Driver di Tujuan
  const handleConfirmDelivery = () => {
    if (!activeOrder) return;
    if (!deliveryOtpInput.trim()) {
      setDeliveryOtpError('Masukkan 4 digit kode OTP penerimaan dari penerima!');
      return;
    }

    const result = realtimeStore.verifyDeliveryPackage(activeOrder.orderId, {
      receivedBy: deliveryReceivedBy || activeOrder.recipientContact?.name || 'Penerima',
      relationship: deliveryRelationship,
      photoUrl: deliveryPhotoSimulated,
      notes: deliveryNotes,
      otp: deliveryOtpInput
    });

    if (!result.success) {
      setDeliveryOtpError(result.message);
    } else {
      setDeliveryOtpError(null);
    }
  };

  // Incoming Order Listener Simulation
  useEffect(() => {
    if (driver?.isOnline && pendingOrder && !activeOrder && pendingOrder.status === 'SEARCHING') {
      setShowIncomingModal(true);
      setCountdown(30);

      // Play simulated beep sound using Web Audio API if enabled
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } catch {
          // AudioContext might be restricted until user gesture
        }
      }
    } else {
      setShowIncomingModal(false);
    }
  }, [driver.isOnline, pendingOrder, activeOrder, soundEnabled]);

  // Countdown timer for incoming order
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showIncomingModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setShowIncomingModal(false);
            if (pendingOrder) onRejectOrder(pendingOrder.orderId);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showIncomingModal, countdown, pendingOrder, onRejectOrder]);

  const handleAccept = () => {
    if (pendingOrder) {
      setShowIncomingModal(false);
      onAcceptOrder(pendingOrder.orderId);
    }
  };

  const handleReject = () => {
    if (pendingOrder) {
      setShowIncomingModal(false);
      onRejectOrder(pendingOrder.orderId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl relative select-none">
      {/* Android Top Status Bar */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-1.5 font-bold">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 font-extrabold">OjekDriver (Android Mitra)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1 font-mono text-[10px]">
            GPS: <span className="text-emerald-600 font-bold">2.5s</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>98%</span>
        </div>
      </div>

      {/* Driver Header Card (Online/Offline Toggle) */}
      <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={driver.avatar}
              alt={driver.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-xs"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                driver.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">{driver.name}</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-mono font-bold text-slate-700">{driver.plateNumber}</span>
              <span>•</span>
              <span className="text-amber-500 font-bold">★ {driver.rating}</span>
            </div>
          </div>
        </div>

        {/* Toggle Online / Offline Switch */}
        <button
          onClick={() => onToggleOnline(!driver.isOnline)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
            driver.isOnline
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-100 text-slate-500 border border-slate-300 hover:text-slate-800'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{driver.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </button>
      </div>

      {/* Driver Map Preview */}
      <div className="relative h-60 sm:h-64 w-full shrink-0 border-b border-slate-200">
        <InteractiveMap
          origin={activeOrder?.origin}
          destination={activeOrder?.destination}
          driverLocation={driver.location}
          tripStep={activeOrder?.tripStep}
        />

        {/* GPS Live Status Pill */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-mono text-slate-700 font-bold">
            {driver.location.lat.toFixed(4)}, {driver.location.lng.toFixed(4)}
          </span>
        </div>

        {/* Sound alert toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/95 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          title={soundEnabled ? 'Suara Order Aktif' : 'Suara Order Senyap'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Driver Bottom Action Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        
        {/* CASE 1: OFFLINE */}
        {!driver.isOnline && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Power className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Anda Sedang Offline</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Aktifkan status Online untuk mulai menerima orderan ojek dari penumpang di sekitar.
              </p>
            </div>
            <button
              onClick={() => onToggleOnline(true)}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              Nyalakan Status Online
            </button>
          </div>
        )}

        {/* CASE 2: ONLINE & STANDBY (Menunggu Order) */}
        {driver.isOnline && !activeOrder && !showIncomingModal && (
          <div className="p-6 bg-white rounded-2xl border border-blue-200 text-center space-y-3.5 shadow-sm">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping"></div>
              <Radio className="w-7 h-7 text-blue-600 animate-pulse relative" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Siap Menerima Order</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                GPS Fused Location aktif memperbarui koordinat ke Firebase setiap 2.5 detik.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-around text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Trip Selesai:</span>
                <span className="font-black text-emerald-600 text-sm">{driver.completedTrips}</span>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <span className="text-slate-400 text-[10px] block font-semibold uppercase">Rating:</span>
                <span className="font-black text-amber-500 text-sm">★ {driver.rating}</span>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: ACTIVE TRIP (Sedang Menjalankan Order) */}
        {driver.isOnline && activeOrder && (
          <div className="space-y-3">
            {/* Customer & Package Info Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                    activeOrder.serviceType === 'SEND' ? 'text-orange-600' : 'text-emerald-600'
                  }`}>
                    {activeOrder.serviceType === 'SEND' ? 'Pengirim Paket' : 'Penumpang Ojek'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900">{activeOrder.customerName}</h4>
                  <p className="text-xs text-slate-500">{activeOrder.customerPhone}</p>
                </div>
                <a
                  href={`tel:${activeOrder.customerPhone}`}
                  className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-xs"
                  title="Telepon Pelanggan"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Rincian Khusus Paket Kilat untuk Driver */}
              {activeOrder.serviceType === 'SEND' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-orange-800 font-black">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-orange-600" />
                      <span>Order Paket Kilat (Sameday)</span>
                    </div>
                    <span className="text-[9px] bg-orange-200/90 px-2 py-0.5 rounded font-mono text-orange-950 font-black">
                      {activeOrder.packageItem?.category || 'PAKET'}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-orange-200/80 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nama Barang:</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {activeOrder.packageItem?.itemName || activeOrder.packageType || 'Barang Paket Kilat'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Bobot / Dimensi:</span>
                        <span className="font-bold text-orange-700 text-xs">
                          {activeOrder.packageItem?.weightKg || 2} kg • {activeOrder.packageItem?.sizeCategory || 'SEDANG'}
                        </span>
                      </div>
                    </div>

                    {activeOrder.packageItem?.specialHandling && activeOrder.packageItem.specialHandling.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {activeOrder.packageItem.specialHandling.map((h, i) => (
                          <span key={i} className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            ⚠️ {h === 'FRAGILE' ? 'Pecah Belah' : h === 'KEEP_UPRIGHT' ? 'Harus Tegak' : h === 'WATERPROOF' ? 'Tahan Air' : h}
                          </span>
                        ))}
                      </div>
                    )}

                    {(activeOrder.packageItem?.specialNotes || activeOrder.packageNotes) && (
                      <p className="text-[11px] text-slate-600 pt-0.5">
                        <span className="font-bold text-slate-700">Instruksi:</span> {activeOrder.packageItem?.specialNotes || activeOrder.packageNotes}
                      </p>
                    )}
                  </div>

                  {/* Info Pengirim & Penerima Lengkap */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <span className="text-[9px] font-bold text-emerald-800 block uppercase">Pengirim:</span>
                      <span className="font-extrabold text-slate-800 truncate block">
                        {activeOrder.senderContact?.name || activeOrder.customerName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {activeOrder.senderContact?.phone || activeOrder.customerPhone}
                      </span>
                      {activeOrder.senderContact?.addressNote && (
                        <span className="text-[9px] text-emerald-700 block italic line-clamp-1 mt-0.5">
                          "{activeOrder.senderContact.addressNote}"
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-200">
                      <span className="text-[9px] font-bold text-rose-800 block uppercase">Penerima:</span>
                      <span className="font-extrabold text-slate-800 truncate block">
                        {activeOrder.recipientContact?.name || 'Penerima Paket'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {activeOrder.recipientContact?.phone || '0813-xxxx-xxxx'}
                      </span>
                      {activeOrder.recipientContact?.addressNote && (
                        <span className="text-[9px] text-rose-700 block italic line-clamp-1 mt-0.5">
                          "{activeOrder.recipientContact.addressNote}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rincian Khusus Ojek Car untuk Driver Mobil */}
              {activeOrder.serviceType === 'CAR' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-blue-900 font-black">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span>Order Ojek Car (Mobil AC)</span>
                    </div>
                    <span className="text-[9px] bg-blue-200 px-2 py-0.5 rounded font-mono text-blue-950 font-black">
                      {activeOrder.carTier === 'CAR_XL' ? 'CAR XL (6-SEAT)' : activeOrder.carTier === 'CAR_COMFORT' ? 'CAR COMFORT VIP' : 'CAR REGULER'}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 space-y-1.5">
                    {activeOrder.pickupLobbyLandmark && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Titik Temu Lobi Penjemputan:</span>
                          <span className="font-extrabold text-slate-900">{activeOrder.pickupLobbyLandmark}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Pilihan Rute:</span>
                      <span className="font-bold text-blue-700">{activeOrder.useTollRoad ? '✓ Lewat Jalan Tol Bebas Hambatan' : 'Jalan Arteri Non-Tol'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Jumlah Penumpang:</span>
                      <span className="font-bold text-slate-800">{activeOrder.passengerCount || 1} Orang</span>
                    </div>
                    {activeOrder.paymentMethod === 'CASH' && activeOrder.cashChangeNote && (
                      <div className="flex justify-between items-center text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        <span>Info Uang Tunai Penumpang:</span>
                        <span className="font-bold">{activeOrder.cashChangeNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Route checkpoints */}
              <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-2 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {activeOrder.serviceType === 'SEND' ? 'Lokasi Ambil Paket (Pengirim):' :
                       activeOrder.serviceType === 'FOOD' ? 'Resto Mitra Penjual:' : 'Titik Jemput:'}
                    </span>
                    <span className="text-slate-800 font-bold">
                      {activeOrder.merchantName || activeOrder.origin.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {activeOrder.serviceType === 'SEND' ? 'Lokasi Antar Paket (Penerima):' :
                       activeOrder.serviceType === 'FOOD' ? 'Alamat Antar Pemesan:' : 'Tujuan:'}
                    </span>
                    <span className="text-slate-800 font-bold">{activeOrder.destination.name}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Menu jika Pesanan Food */}
              {activeOrder.serviceType === 'FOOD' && activeOrder.items && activeOrder.items.length > 0 && (
                <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200 text-xs space-y-1">
                  <span className="text-[10px] font-black text-rose-800 uppercase block">
                    Pesanan Makanan ({activeOrder.items.length} Menu):
                  </span>
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono font-bold">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cash Fare to Collect */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">
                  {activeOrder.paymentMethod === 'CASH'
                    ? (activeOrder.payerType === 'RECIPIENT' ? 'Terima Tunai di Tujuan (COD):' : 'Terima Tunai dari Pengirim:')
                    : 'Ongkir Non-Tunai / Saldo Digital:'}
                </span>
                <span className="font-black text-emerald-600 text-base font-mono">
                  {activeOrder.paymentMethod === 'CASH'
                    ? `Rp ${activeOrder.totalFare.toLocaleString('id-ID')}`
                    : `Rp ${activeOrder.totalFare.toLocaleString('id-ID')} (LUNAS)`}
                </span>
              </div>
            </div>

            {/* TRIP LIFECYCLE ACTION BUTTONS & VERIFICATION WORKFLOWS */}

            {/* STEP 1: Menuju Penjemputan -> Tiba di Jemput */}
            {activeOrder.tripStep === 'HEADING_TO_PICKUP' && (
              <button
                onClick={() => onUpdateTripStep(activeOrder.orderId, 'ARRIVED_AT_PICKUP')}
                className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                  activeOrder.serviceType === 'SEND'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/30'
                    : activeOrder.serviceType === 'FOOD'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-rose-600/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/30'
                }`}
              >
                <span>
                  {activeOrder.serviceType === 'SEND' ? 'Saya Sudah Tiba di Lokasi Pengirim (Ambil Paket)' :
                   activeOrder.serviceType === 'FOOD' ? 'Saya Sudah Tiba di Resto Penjual' :
                   'Saya Sudah Tiba di Titik Jemput'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* STEP 2: VERIFIKASI PENGAMBILAN PAKET (PAKET KILAT KHUSUS) */}
            {activeOrder.tripStep === 'ARRIVED_AT_PICKUP' && activeOrder.serviceType === 'SEND' && (
              <div className="p-4 bg-white rounded-3xl border-2 border-orange-500 shadow-xl space-y-3.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Verifikasi Penjemputan Paket</h4>
                      <p className="text-[10px] text-slate-500">Ambil foto paket & masukkan kode OTP dari pengirim</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-black">
                    LANGKAH 1 DARI 2
                  </span>
                </div>

                {/* 1. Foto Bukti Ambil Paket */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                    <span>1. Bukti Foto Paket Tersegel:</span>
                    <button
                      type="button"
                      onClick={() => setPickupPhotoSimulated('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=80')}
                      className="text-[9px] text-orange-600 hover:underline font-bold"
                    >
                      Perbarui Foto
                    </button>
                  </label>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-32 flex items-center justify-center">
                    <img
                      src={pickupPhotoSimulated}
                      alt="Preview Paket"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[9px] px-2 py-0.5 rounded-lg backdrop-blur-xs font-mono">
                      ✓ Kamera Fused
                    </div>
                  </div>
                </div>

                {/* 2. Catatan Kondisi Paket */}
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">
                    2. Catatan Kondisi Fisik Paket:
                  </label>
                  <input
                    type="text"
                    value={pickupConditionNotes}
                    onChange={(e) => setPickupConditionNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Kondisi paket saat diambil..."
                  />
                </div>

                {/* 3. Sistem Keamanan OTP Penjemputan */}
                <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-orange-950 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                      <span>3. Masukkan 4 Digit Kode OTP Pengirim:</span>
                    </label>
                    {activeOrder.pickupOtp && (
                      <button
                        type="button"
                        onClick={() => setPickupOtpInput(activeOrder.pickupOtp || '4829')}
                        className="text-[9px] bg-orange-200 hover:bg-orange-300 text-orange-950 px-2 py-0.5 rounded-md font-bold transition-colors"
                        title="Klik untuk otomatis mengisi OTP pengirim untuk pengujian demo"
                      >
                        Auto-Fill ({activeOrder.pickupOtp})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={pickupOtpInput}
                    onChange={(e) => {
                      setPickupOtpInput(e.target.value);
                      if (pickupOtpError) setPickupOtpError(null);
                    }}
                    placeholder="Contoh: 4829"
                    className="w-full text-center tracking-widest text-lg font-mono font-black py-2 rounded-xl bg-white border border-orange-300 text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[9px] text-slate-500 text-center">
                    Minta 4 digit kode OTP yang tertera di aplikasi pengirim untuk konfirmasi keamanan penjemputan.
                  </p>
                  {pickupOtpError && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pickupOtpError}</span>
                    </div>
                  )}
                </div>

                {/* Tombol Konfirmasi Pengambilan */}
                <button
                  type="button"
                  onClick={handleConfirmPickup}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Paket Sudah Diambil & Mulai Pengantaran</span>
                </button>
              </div>
            )}

            {/* Step 2 Default (Non-SEND): Tiba di Jemput -> Mulai Perjalanan */}
            {activeOrder.tripStep === 'ARRIVED_AT_PICKUP' && activeOrder.serviceType !== 'SEND' && (
              <button
                onClick={() => onUpdateTripStep(activeOrder.orderId, 'ON_THE_WAY')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {activeOrder.serviceType === 'FOOD' ? 'Makanan Diterima, Mulai Antar ke Pelanggan' :
                   'Mulai Perjalanan (Bawa Penumpang)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* STEP 3: On The Way -> Sampai di Tujuan */}
            {activeOrder.tripStep === 'ON_THE_WAY' && (
              <button
                onClick={() => onUpdateTripStep(activeOrder.orderId, 'ARRIVED_AT_DESTINATION')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {activeOrder.serviceType === 'SEND' ? 'Saya Sudah Tiba di Lokasi Penerima Paket' :
                   activeOrder.serviceType === 'FOOD' ? 'Tiba di Alamat Antar Pelanggan' :
                   'Tiba di Lokasi Tujuan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* STEP 4: VERIFIKASI PENERIMA & OTP PENGANTARAN (PAKET KILAT KHUSUS) */}
            {activeOrder.tripStep === 'ARRIVED_AT_DESTINATION' && activeOrder.serviceType === 'SEND' && (
              <div className="p-4 bg-white rounded-3xl border-2 border-emerald-500 shadow-xl space-y-3.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Verifikasi Penerima & Selesaikan Transaksi</h4>
                      <p className="text-[10px] text-slate-500">Serahkan paket, cek identitas penerima & validasi OTP</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                    LANGKAH 2 DARI 2
                  </span>
                </div>

                {/* 1. Nama Orang yang Menerima */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      1. Nama yang Menerima:
                    </label>
                    <input
                      type="text"
                      value={deliveryReceivedBy}
                      onChange={(e) => setDeliveryReceivedBy(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nama Penerima..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      Relasi dengan Penerima:
                    </label>
                    <select
                      value={deliveryRelationship}
                      onChange={(e) => setDeliveryRelationship(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Penerima Langsung">Penerima Langsung</option>
                      <option value="Keluarga / Kerabat">Keluarga / Kerabat</option>
                      <option value="Satpam / Pos Security">Satpam / Pos Security</option>
                      <option value="Resepsionis Kantor">Resepsionis Kantor</option>
                      <option value="Tetangga">Tetangga</option>
                    </select>
                  </div>
                </div>

                {/* 2. Sistem Keamanan OTP Penerima */}
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-emerald-950 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Masukkan 4 Digit Kode OTP Penerima:</span>
                    </label>
                    {activeOrder.deliveryOtp && (
                      <button
                        type="button"
                        onClick={() => setDeliveryOtpInput(activeOrder.deliveryOtp || '7193')}
                        className="text-[9px] bg-emerald-200 hover:bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-md font-bold transition-colors"
                        title="Klik untuk otomatis mengisi OTP penerima untuk pengujian demo"
                      >
                        Auto-Fill ({activeOrder.deliveryOtp})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={deliveryOtpInput}
                    onChange={(e) => {
                      setDeliveryOtpInput(e.target.value);
                      if (deliveryOtpError) setDeliveryOtpError(null);
                    }}
                    placeholder="Contoh: 7193"
                    className="w-full text-center tracking-widest text-lg font-mono font-black py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[9px] text-slate-500 text-center">
                    Minta 4 digit kode OTP yang tertera pada aplikasi / SMS penerima paket.
                  </p>
                  {deliveryOtpError && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{deliveryOtpError}</span>
                    </div>
                  )}
                </div>

                {/* 3. Foto Bukti Serah Terima */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                    <span>3. Foto Bukti Serah Terima Paket:</span>
                    <button
                      type="button"
                      onClick={() => setDeliveryPhotoSimulated('https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&auto=format&fit=crop&q=80')}
                      className="text-[9px] text-emerald-600 hover:underline font-bold"
                    >
                      Perbarui Foto
                    </button>
                  </label>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-28 flex items-center justify-center">
                    <img
                      src={deliveryPhotoSimulated}
                      alt="Foto Serah Terima"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[9px] px-2 py-0.5 rounded-lg backdrop-blur-xs font-mono">
                      ✓ Serah Terima
                    </div>
                  </div>
                </div>

                {/* 4. Tagihan Pembayaran & Penyelesaian Transaksi */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {activeOrder.paymentMethod === 'CASH' ? 'Tagihan COD Tunai ke Penerima:' : 'Status Ongkir Pembayaran:'}
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {activeOrder.paymentMethod === 'CASH'
                        ? `Rp ${activeOrder.totalFare.toLocaleString('id-ID')}`
                        : 'LUNAS (Non-Tunai / Saldo)'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                    {activeOrder.paymentMethod === 'CASH' ? 'Terima Tunai' : 'Auto Saldo'}
                  </span>
                </div>

                {/* Tombol Selesaikan Transaksi */}
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Selesaikan Transaksi & Terima Ongkir Paket</span>
                </button>
              </div>
            )}

            {/* Step 4 Default (Non-SEND): Selesai & Terima Cash */}
            {activeOrder.tripStep === 'ARRIVED_AT_DESTINATION' && activeOrder.serviceType !== 'SEND' && (
              <button
                onClick={() => onUpdateTripStep(activeOrder.orderId, 'COMPLETED')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Banknote className="w-4 h-4" />
                <span>
                  {activeOrder.serviceType === 'FOOD' ? 'Makanan Diterima Pelanggan & Terima Cash' :
                   'Selesai & Terima Cash'} (Rp {activeOrder.totalFare.toLocaleString('id-ID')})
                </span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* POP-UP MODAL: ORDER MASUK (Background Service Listener) */}
      {showIncomingModal && pendingOrder && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col justify-end z-30 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className={`bg-white rounded-3xl p-5 border-2 shadow-2xl space-y-3.5 ${
            pendingOrder.serviceType === 'SEND'
              ? 'border-orange-500'
              : pendingOrder.serviceType === 'FOOD'
              ? 'border-rose-500'
              : 'border-emerald-500'
          }`}>
            {/* Header with Countdown ring */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full animate-ping ${
                  pendingOrder.serviceType === 'SEND'
                    ? 'bg-orange-500'
                    : pendingOrder.serviceType === 'FOOD'
                    ? 'bg-rose-500'
                    : pendingOrder.serviceType === 'CAR'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500'
                }`}></span>
                <h4 className={`text-sm font-black tracking-wide uppercase flex items-center gap-1.5 ${
                  pendingOrder.serviceType === 'SEND'
                    ? 'text-orange-700'
                    : pendingOrder.serviceType === 'FOOD'
                    ? 'text-rose-700'
                    : pendingOrder.serviceType === 'CAR'
                    ? 'text-blue-700'
                    : 'text-emerald-700'
                }`}>
                  {pendingOrder.serviceType === 'SEND' ? (
                    <>
                      <Package className="w-4 h-4 text-orange-600" />
                      <span>ORDER PAKET KILAT MASUK!</span>
                    </>
                  ) : pendingOrder.serviceType === 'FOOD' ? (
                    <>
                      <Utensils className="w-4 h-4 text-rose-600" />
                      <span>ORDER OJEK FOOD MASUK!</span>
                    </>
                  ) : pendingOrder.serviceType === 'CAR' ? (
                    <>
                      <Car className="w-4 h-4 text-blue-600" />
                      <span>ORDER OJEK CAR (MOBIL) MASUK!</span>
                    </>
                  ) : (
                    <span>ORDER OJEK MASUK!</span>
                  )}
                </h4>
              </div>
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-mono font-black ${
                pendingOrder.serviceType === 'SEND'
                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                  : pendingOrder.serviceType === 'FOOD'
                  ? 'bg-rose-50 border-rose-500 text-rose-700'
                  : pendingOrder.serviceType === 'CAR'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-700'
              }`}>
                {countdown}s
              </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Jarak Tempuh</span>
                  <span className="text-sm font-black text-slate-900">{pendingOrder.distanceKm} km</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Estimasi Tarif Tunai</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    Rp {pendingOrder.totalFare.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Rincian Menu jika Ojek Food */}
              {pendingOrder.serviceType === 'FOOD' && (
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Utensils className="w-3.5 h-3.5 text-rose-600" />
                      <span>Resto Penjual:</span>
                    </span>
                    <span className="font-extrabold text-rose-950 px-2 py-0.5 rounded bg-rose-200/80">
                      {pendingOrder.merchantName || pendingOrder.origin.name}
                    </span>
                  </div>
                  {pendingOrder.items && pendingOrder.items.length > 0 && (
                    <div className="text-[10px] text-slate-700 space-y-0.5 pt-1">
                      {pendingOrder.items.map((it, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-mono">Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rincian Paket jika Paket Kilat */}
              {pendingOrder.serviceType === 'SEND' && (
                <div className="bg-orange-50/90 p-3 rounded-2xl border border-orange-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-orange-950 font-black">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Package className="w-4 h-4 text-orange-600" />
                      <span>{pendingOrder.packageItem?.itemName || pendingOrder.packageType || 'Paket Barang'}</span>
                    </span>
                    <span className="font-extrabold text-[10px] text-orange-900 px-2 py-0.5 rounded bg-orange-200/80">
                      {pendingOrder.packageItem?.weightKg || 2} kg • {pendingOrder.packageItem?.sizeCategory || 'SEDANG'}
                    </span>
                  </div>

                  {pendingOrder.packageItem?.specialHandling && pendingOrder.packageItem.specialHandling.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pendingOrder.packageItem.specialHandling.map((h, i) => (
                        <span key={i} className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          ⚠️ {h === 'FRAGILE' ? 'Pecah Belah' : h === 'KEEP_UPRIGHT' ? 'Harus Tegak' : h === 'WATERPROOF' ? 'Tahan Air' : h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-orange-200/60">
                    <div>
                      <span className="text-slate-400 block font-semibold">Pengirim:</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {pendingOrder.senderContact?.name || pendingOrder.customerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Penerima:</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {pendingOrder.recipientContact?.name || 'Penerima'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] bg-white/80 px-2.5 py-1.5 rounded-xl border border-orange-200">
                    <span className="text-slate-500 font-medium">Penagihan Ongkir:</span>
                    <span className="font-bold text-orange-700">
                      {pendingOrder.payerType === 'RECIPIENT' ? 'COD ke Penerima di Tujuan' : 'Dibayar Pengirim di Awal'}
                    </span>
                  </div>
                </div>
              )}

              {/* Rincian Pesanan jika Ojek Car (Mobil) */}
              {pendingOrder.serviceType === 'CAR' && (
                <div className="bg-blue-50/90 p-3 rounded-2xl border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-blue-950 font-black">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span>Ojek Car ({pendingOrder.carTier === 'CAR_XL' ? 'Car XL 6-Seat' : pendingOrder.carTier === 'CAR_COMFORT' ? 'Car Comfort VIP' : 'Car Reguler'})</span>
                    </span>
                    <span className="font-extrabold text-[10px] text-blue-900 px-2 py-0.5 rounded bg-blue-200/80">
                      {pendingOrder.passengerCount || 1} PENUMPANG
                    </span>
                  </div>

                  {pendingOrder.pickupLobbyLandmark && (
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100 text-[11px]">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Titik Lobi Temu:</span>
                      <span className="font-bold text-slate-800">{pendingOrder.pickupLobbyLandmark}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] bg-white/80 px-2.5 py-1.5 rounded-xl border border-blue-200">
                    <span className="text-slate-500 font-medium">Preferensi Rute & Bayar:</span>
                    <span className="font-bold text-blue-700">
                      {pendingOrder.useTollRoad ? 'Lewat Jalan Tol' : 'Non-Tol'} • {pendingOrder.paymentMethod}
                    </span>
                  </div>
                </div>
              )}

              {/* Route */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-800 font-semibold truncate">
                    {pendingOrder.serviceType === 'SEND' ? 'Ambil Paket: ' :
                     pendingOrder.serviceType === 'FOOD' ? 'Ambil Resto: ' : 'Jemput: '}
                    {pendingOrder.merchantName || pendingOrder.origin.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-800 font-semibold truncate">
                    {pendingOrder.serviceType === 'SEND' ? 'Antar Paket: ' :
                     pendingOrder.serviceType === 'FOOD' ? 'Antar Pelanggan: ' : 'Tujuan: '}
                    {pendingOrder.destination.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Accept / Reject Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleReject}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-rose-600 font-bold text-xs border border-slate-200 transition-colors"
              >
                Tolak
              </button>
              <button
                onClick={handleAccept}
                className={`py-3 px-4 rounded-xl text-white font-black text-xs shadow-lg transition-colors ${
                  pendingOrder.serviceType === 'SEND'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30'
                }`}
              >
                Terima Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
