import React from 'react';
import {
  Globe,
  Smartphone,
  Database,
  Cloud,
  Layers,
  MapPin,
  CreditCard,
  Bell,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  FolderGit2
} from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Rancangan Arsitektur Sistem MVP Ojek Online</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Serverless & Cloud Infrastructure: 2 Aplikasi Klien Terpisah + 1 Shared Firebase Realtime Backend
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
          PROD-READY ARCHITECTURE
        </span>
      </div>

      {/* Main Visual Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        
        {/* COL 1: CLIENT WEB (CUSTOMER) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-200 space-y-3 relative group shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm pb-2 border-b border-slate-200">
            <Globe className="w-4 h-4" />
            <span>Aplikasi Pelanggan (Web)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Framework:</strong> React 19 / Next.js (App Router)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Maps & Lokasi:</strong> Google Maps Platform (Places Autocomplete + Directions)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Aksi:</strong> Hitung estimasi tarif, buat order (<code>status: "SEARCHING"</code>), pantau marker driver live</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Hosting:</strong> Vercel (Edge CDN)</span>
            </li>
          </ul>
          <div className="pt-2 text-[11px] font-mono text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            Write: /orders/{'{orderId}'}<br/>
            Read: /drivers/{'{driverId}'}/location
          </div>
        </div>

        {/* COL 2: SHARED FIREBASE BACKEND */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-amber-200 space-y-3 relative shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm pb-2 border-b border-slate-200">
            <Database className="w-4 h-4" />
            <span>Shared Firebase Backend</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Realtime Database:</strong> Latensi sub-100ms WebSocket sinkronisasi data order & GPS</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Authentication:</strong> Firebase Auth (Anonymous / SMS OTP Phone Auth)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Push Notification:</strong> Firebase Cloud Messaging (FCM) jika app driver di background</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Security Rules:</strong> Atomic validation status transition</span>
            </li>
          </ul>
          <div className="pt-2 text-[11px] font-mono text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            WebSocket Pub/Sub Engine<br/>
            Region: asia-southeast1 (SG)
          </div>
        </div>

        {/* COL 3: CLIENT ANDROID (DRIVER) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-blue-200 space-y-3 relative shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-sm pb-2 border-b border-slate-200">
            <Smartphone className="w-4 h-4" />
            <span>Aplikasi Driver (Android Native)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Tech Stack:</strong> Kotlin + Jetpack Compose + Material 3</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>GPS Tracking:</strong> FusedLocationProviderClient (Interval 2.5s) via Foreground Service</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Order Listener:</strong> Firebase RTDB query <code>status == "SEARCHING"</code></span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>Trip Lifecycle:</strong> Menuju Jemput ➔ Bawa Penumpang ➔ Selesai & Cash</span>
            </li>
          </ul>
          <div className="pt-2 text-[11px] font-mono text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            Listen: /orders (status == "SEARCHING")<br/>
            Write: /drivers/{'{driverId}'}/location
          </div>
        </div>

      </div>

      {/* Auxiliary Serverless & Payment Gateway Ready Bar */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 block">Vercel Serverless</span>
            <span className="text-[10px] text-slate-500">Node.js API & Webhook Handler</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-slate-700">
          <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 block">Midtrans / Xendit</span>
            <span className="text-[10px] text-slate-500">Cash (MVP) + QRIS / E-Wallet Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-slate-700">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 block">Google Maps Platform</span>
            <span className="text-[10px] text-slate-500">Places Autocomplete & Routes API</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-slate-700">
          <FolderGit2 className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 block">GitHub Monorepo</span>
            <span className="text-[10px] text-slate-500">Single Source of Truth CI/CD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
