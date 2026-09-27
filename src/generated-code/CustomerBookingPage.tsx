'use client';

/**
 * Halaman Pemesanan Customer (Next.js App Router / React)
 * Integrasi:
 * - Firebase Realtime Database (push order & listen driver location)
 * - Google Maps Platform (Directions, Places Autocomplete & Advanced Marker)
 */

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, update } from 'firebase/database';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

// Inisialisasi Firebase Client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

interface LatLng {
  lat: number;
  lng: number;
}

interface PlaceItem {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function CustomerBookingPage() {
  const [origin, setOrigin] = useState<PlaceItem>({
    name: 'Stasiun Gambir',
    address: 'Gambir, Jakarta Pusat',
    lat: -6.1767,
    lng: 106.8306
  });

  const [destination, setDestination] = useState<PlaceItem>({
    name: 'Grand Indonesia',
    address: 'Jl. M.H. Thamrin, Jakarta Pusat',
    lat: -6.1950,
    lng: 106.8208
  });

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('IDLE');
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // Estimasi tarif: Rp 8.000 (0-2 km) + Rp 2.500 / km + Rp 2.000 biaya jasa
  const distanceKm = 3.5; 
  const totalFare = 8000 + Math.max(0, distanceKm - 2) * 2500 + 2000;

  // 1. Submit Order ke Firebase Realtime Database
  const handlePesanOjek = async () => {
    try {
      const ordersRef = ref(db, 'orders');
      const newOrderRef = push(ordersRef);
      const newOrderId = newOrderRef.key;

      const orderData = {
        orderId: newOrderId,
        customerId: 'cust_001', // Diambil dari Firebase Auth UID
        customerName: 'Pelanggan Ojek',
        origin,
        destination,
        distanceKm,
        totalFare,
        status: 'SEARCHING', // Status awal
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        createdAt: Date.now()
      };

      await set(newOrderRef, orderData);
      setOrderId(newOrderId);
      setOrderStatus('SEARCHING');

      // 2. Dengarkan perubahan status order secara real-time
      onValue(newOrderRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setOrderStatus(data.status);
          if (data.status === 'ACCEPTED' || data.status === 'ON_TRIP') {
            setDriverInfo({
              name: data.driverName,
              plate: data.driverPlate,
              phone: data.driverPhone
            });

            // 3. Jika driver menerima, dengarkan posisi GPS driver di /drivers/{driverId}/location
            if (data.driverId) {
              const driverLocRef = ref(db, `drivers/${data.driverId}/location`);
              onValue(driverLocRef, (locSnap) => {
                const loc = locSnap.val();
                if (loc) {
                  setDriverLocation({ lat: loc.lat, lng: loc.lng });
                }
              });
            }
          }
        }
      });
    } catch (err) {
      console.error('Gagal memesan ojek:', err);
    }
  };

  const handleBatalOrder = async () => {
    if (orderId) {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, { status: 'CANCELLED' });
      setOrderStatus('CANCELLED');
    }
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      solutionChannel="gmp_mcp_codeassist_v1_aistudio"
    >
      <main className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100 relative">
        {/* Google Maps Container */}
        <div className="w-full h-1/2 relative">
          <Map
            defaultCenter={{ lat: -6.185, lng: 106.825 }}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {/* Marker Penjemputan */}
            <AdvancedMarker position={{ lat: origin.lat, lng: origin.lng }} title="Titik Jemput" />

            {/* Marker Tujuan */}
            <AdvancedMarker position={{ lat: destination.lat, lng: destination.lng }} title="Tujuan" />

            {/* Marker Posisi Driver yang bergerak Real-Time */}
            {driverLocation && (
              <AdvancedMarker position={driverLocation} title="Posisi Mitra Driver" />
            )}
          </Map>
        </div>

        {/* Bottom Booking Panel */}
        <div className="flex-1 p-5 bg-slate-900 rounded-t-3xl border-t border-slate-800 -mt-4 z-10 space-y-4">
          {orderStatus === 'IDLE' && (
            <>
              <h2 className="text-lg font-bold">Pesan Ojek Online</h2>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400 font-semibold block">JEMPUT</span>
                  <p className="font-medium">{origin.name}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-semibold block">TUJUAN</span>
                  <p className="font-medium">{destination.name}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 block">Total Jarak: {distanceKm} km</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    Rp {totalFare.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                  Bayar Tunai / Cash
                </span>
              </div>

              <button
                onClick={handlePesanOjek}
                className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
              >
                Pesan Ojek Sekarang
              </button>
            </>
          )}

          {orderStatus === 'SEARCHING' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <h3 className="font-bold text-base">Mencari Driver Terdekat...</h3>
              <p className="text-xs text-slate-400">Menghubungkan ke mitra pengemudi terdekat</p>
              <button
                onClick={handleBatalOrder}
                className="px-4 py-2 text-xs border border-rose-500 text-rose-400 rounded-lg"
              >
                Batalkan
              </button>
            </div>
          )}

          {(orderStatus === 'ACCEPTED' || orderStatus === 'ON_TRIP') && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl">
                <span className="text-xs text-blue-300 font-bold">Mitra Driver Ditemukan!</span>
                <h4 className="text-base font-bold">{driverInfo?.name}</h4>
                <p className="text-xs text-slate-400">Plat Nomor: {driverInfo?.plate}</p>
              </div>
              <p className="text-xs text-slate-300">
                Driver sedang bergerak menuju lokasi Anda. Pantau pergerakan marker motor di peta.
              </p>
            </div>
          )}
        </div>
      </main>
    </APIProvider>
  );
}
