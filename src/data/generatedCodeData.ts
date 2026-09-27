export interface CodeFileItem {
  name: string;
  language: string;
  category: 'web' | 'android' | 'firebase' | 'guide';
  description: string;
  code: string;
}

export const GENERATED_CODE_FILES: CodeFileItem[] = [
  {
    name: 'CustomerBookingPage.tsx',
    language: 'typescript',
    category: 'web',
    description: 'Halaman Pemesanan Customer (Next.js / React) dengan Firebase RTDB & Google Maps',
    code: `'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, update } from 'firebase/database';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

// Inisialisasi Firebase Web SDK
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

export default function CustomerBookingPage() {
  const [origin, setOrigin] = useState({
    name: 'Stasiun Gambir',
    lat: -6.1767,
    lng: 106.8306
  });

  const [destination, setDestination] = useState({
    name: 'Grand Indonesia',
    lat: -6.1950,
    lng: 106.8208
  });

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('IDLE');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  // Kalkulasi tarif: Tarif minimum Rp 8.000 (0-2 km) + Rp 2.500/km + Rp 2.000 jasa aplikasi
  const distanceKm = 3.5;
  const totalFare = 8000 + Math.max(0, distanceKm - 2) * 2500 + 2000;

  // 1. Kirim order ke Firebase Realtime Database
  const handlePesanOjek = async () => {
    try {
      const ordersRef = ref(db, 'orders');
      const newOrderRef = push(ordersRef);
      const newOrderId = newOrderRef.key;

      const orderData = {
        orderId: newOrderId,
        customerId: 'usr_cust_8829', // ID pengguna terautentikasi
        customerName: 'Rian Pratama',
        origin,
        destination,
        distanceKm,
        totalFare,
        status: 'SEARCHING', // Status awal pencarian
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

            // 3. Jika driver menerima, pantau koordinat GPS driver secara real-time
            if (data.driverId) {
              const driverLocRef = ref(db, \`drivers/\${data.driverId}/location\`);
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
      console.error('Gagal membuat order:', err);
    }
  };

  const handleBatalOrder = async () => {
    if (orderId) {
      const orderRef = ref(db, \`orders/\${orderId}\`);
      await update(orderRef, { status: 'CANCELLED' });
      setOrderStatus('CANCELLED');
    }
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      solutionChannel="gmp_mcp_codeassist_v1_aistudio"
    >
      <main className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100">
        {/* Peta Google Maps */}
        <div className="w-full h-1/2 relative">
          <Map
            defaultCenter={{ lat: -6.185, lng: 106.825 }}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <AdvancedMarker position={{ lat: origin.lat, lng: origin.lng }} title="Titik Jemput" />
            <AdvancedMarker position={{ lat: destination.lat, lng: destination.lng }} title="Tujuan" />
            {driverLocation && (
              <AdvancedMarker position={driverLocation} title="Mitra Driver Ojek" />
            )}
          </Map>
        </div>

        {/* Panel Pemesanan Bawah */}
        <div className="flex-1 p-5 bg-slate-900 rounded-t-3xl border-t border-slate-800 -mt-4 z-10 space-y-4">
          {orderStatus === 'IDLE' && (
            <>
              <h2 className="text-lg font-bold">Pesan Ojek Online</h2>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400 font-semibold block">PENJEMPUTAN</span>
                  <p className="font-medium">{origin.name}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-semibold block">TUJUAN</span>
                  <p className="font-medium">{destination.name}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 block">Jarak: {distanceKm} km</span>
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
              <button onClick={handleBatalOrder} className="px-4 py-2 text-xs border border-rose-500 text-rose-400 rounded-lg">
                Batalkan
              </button>
            </div>
          )}

          {(orderStatus === 'ACCEPTED' || orderStatus === 'ON_TRIP') && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl">
                <span className="text-xs text-blue-300 font-bold">Mitra Driver Ditemukan!</span>
                <h4 className="text-base font-bold">{driverInfo?.name}</h4>
                <p className="text-xs text-slate-400">Plat Motor: {driverInfo?.plate}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </APIProvider>
  );
}`
  },
  {
    name: 'MainActivity.kt',
    language: 'kotlin',
    category: 'android',
    description: 'Layar Utama Driver (Android Jetpack Compose) dengan Status Switch & Dialog Order Masuk',
    code: `package com.ojek.driver

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import java.text.NumberFormat
import java.util.Locale

class MainActivity : ComponentActivity() {
    private val viewModel: DriverViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                DriverMainScreen(viewModel = viewModel, onToggleService = { isOnline ->
                    val serviceIntent = Intent(this, DriverLocationService::class.java)
                    if (isOnline) {
                        serviceIntent.putExtra("DRIVER_ID", viewModel.driverId.value)
                        startForegroundService(serviceIntent)
                    } else {
                        stopService(serviceIntent)
                    }
                })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DriverMainScreen(
    viewModel: DriverViewModel,
    onToggleService: (Boolean) -> Unit
) {
    val isOnline by viewModel.isOnline.collectAsState()
    val driverLocation by viewModel.driverLocation.collectAsState()
    val incomingOrder by viewModel.incomingOrder.collectAsState()
    val activeOrder by viewModel.activeOrder.collectAsState()

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(driverLocation, 15f)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Ojek Driver Mitra", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            if (isOnline) "🟢 Siap Menerima Order" else "⚪ Offline",
                            fontSize = 12.sp,
                            color = if (isOnline) Color(0xFF10B981) else Color.Gray
                        )
                    }
                },
                actions = {
                    Switch(
                        checked = isOnline,
                        onCheckedChange = { checked ->
                            viewModel.setOnlineStatus(checked)
                            onToggleService(checked)
                        }
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState
            ) {
                Marker(state = MarkerState(position = driverLocation), title = "Posisi Driver")
            }

            // Bottom Panel Alur Perjalanan
            activeOrder?.let { order ->
                ActiveOrderCard(order = order, modifier = Modifier.align(Alignment.BottomCenter), onUpdateStep = {
                    viewModel.updateTripStep(order.orderId, it)
                })
            }

            // Pop-up Order Masuk
            incomingOrder?.let { order ->
                IncomingOrderModal(
                    order = order,
                    onAccept = { viewModel.acceptOrder(order.orderId) },
                    onReject = { viewModel.rejectOrder(order.orderId) }
                )
            }
        }
    }
}

@Composable
fun ActiveOrderCard(order: OrderModel, modifier: Modifier, onUpdateStep: (String) -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth().padding(16.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Penumpang: \${order.customerName}", fontWeight = FontWeight.Bold, color = Color.White)
            Text("📍 \${order.origin.name} ➔ 🏁 \${order.destination.name}", color = Color.LightGray)

            when (order.tripStep) {
                "HEADING_TO_PICKUP" -> Button(onClick = { onUpdateStep("ARRIVED_AT_PICKUP") }, modifier = Modifier.fillMaxWidth()) {
                    Text("Tiba di Titik Jemput")
                }
                "ARRIVED_AT_PICKUP" -> Button(onClick = { onUpdateStep("ON_THE_WAY") }, modifier = Modifier.fillMaxWidth()) {
                    Text("Mulai Perjalanan (Bawa Penumpang)")
                }
                "ON_THE_WAY" -> Button(onClick = { onUpdateStep("ARRIVED_AT_DESTINATION") }, modifier = Modifier.fillMaxWidth()) {
                    Text("Tiba di Lokasi Tujuan")
                }
                "ARRIVED_AT_DESTINATION" -> Button(onClick = { onUpdateStep("COMPLETED") }, modifier = Modifier.fillMaxWidth()) {
                    Text("Selesai & Terima Cash (Rp \${order.totalFare})")
                }
            }
        }
    }
}

@Composable
fun IncomingOrderModal(order: OrderModel, onAccept: () -> Unit, onReject: () -> Unit) {
    AlertDialog(
        onDismissRequest = {},
        title = { Text("⚡ ORDER OJEK MASUK!", color = Color(0xFF10B981)) },
        text = { Text("Jarak: \${order.distanceKm} km\\nTarif: Rp \${order.totalFare}\\nTujuan: \${order.destination.name}") },
        confirmButton = { Button(onClick = onAccept) { Text("Terima Order") } },
        dismissButton = { OutlinedButton(onClick = onReject) { Text("Tolak") } }
    )
}`
  },
  {
    name: 'DriverLocationService.kt',
    language: 'kotlin',
    category: 'android',
    description: 'Background Foreground Service untuk GPS Fused Location Provider (Update RTDB per 2.5s)',
    code: `package com.ojek.driver

import android.annotation.SuppressLint
import android.app.*
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.google.firebase.database.FirebaseDatabase

class DriverLocationService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var driverId: String = "drv_mitra_1092"
    private val database = FirebaseDatabase.getInstance()

    companion object {
        private const val CHANNEL_ID = "driver_tracking_channel"
        private const val NOTIFICATION_ID = 1001
        private const val UPDATE_INTERVAL_MS = 2500L // Interval 2.5 detik
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    updateLocationToFirebase(location)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.getStringExtra("DRIVER_ID")?.let { driverId = it }

        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        startLocationUpdates()
        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            UPDATE_INTERVAL_MS
        ).setMinUpdateIntervalMillis(1500L).build()

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }

    // Memperbarui koordinat driver ke Firebase Realtime Database
    private fun updateLocationToFirebase(location: Location) {
        val driverLocationRef = database.getReference("drivers/\$driverId/location")
        val locationData = hashMapOf(
            "lat" to location.latitude,
            "lng" to location.longitude,
            "heading" to location.bearing,
            "accuracyMeters" to location.accuracy,
            "updatedAt" to System.currentTimeMillis()
        )
        driverLocationRef.setValue(locationData)
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ojek Online Mitra Driver")
            .setContentText("GPS Aktif: Mengirim posisi real-time ke Firebase")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "GPS Tracking", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    name: 'DriverViewModel.kt',
    language: 'kotlin',
    category: 'android',
    description: 'State Management & Query Listener /orders status == "SEARCHING"',
    code: `package com.ojek.driver

import androidx.lifecycle.ViewModel
import com.google.android.gms.maps.model.LatLng
import com.google.firebase.database.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class DriverViewModel : ViewModel() {
    private val database = FirebaseDatabase.getInstance()
    val driverId = MutableStateFlow("drv_mitra_1092")

    private val _isOnline = MutableStateFlow(true)
    val isOnline = _isOnline.asStateFlow()

    private val _driverLocation = MutableStateFlow(LatLng(-6.1820, 106.8250))
    val driverLocation = _driverLocation.asStateFlow()

    private val _incomingOrder = MutableStateFlow<OrderModel?>(null)
    val incomingOrder = _incomingOrder.asStateFlow()

    private val _activeOrder = MutableStateFlow<OrderModel?>(null)
    val activeOrder = _activeOrder.asStateFlow()

    init {
        listenToSearchingOrders()
    }

    // Listener realtime membaca order dengan status "SEARCHING"
    private fun listenToSearchingOrders() {
        val query = database.getReference("orders").orderByChild("status").equalTo("SEARCHING")
        query.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!_isOnline.value || _activeOrder.value != null) {
                    _incomingOrder.value = null
                    return
                }
                for (child in snapshot.children) {
                    val order = child.getValue(OrderModel::class.java)
                    if (order?.status == "SEARCHING") {
                        _incomingOrder.value = order
                        break
                    }
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    fun setOnlineStatus(online: Boolean) {
        _isOnline.value = online
        database.getReference("drivers/\${driverId.value}/isOnline").setValue(online)
    }

    fun acceptOrder(orderId: String) {
        val orderRef = database.getReference("orders/\$orderId")
        val updates = hashMapOf<String, Any>(
            "status" to "ACCEPTED",
            "tripStep" to "HEADING_TO_PICKUP",
            "driverId" to driverId.value,
            "driverName" to "Budi Santoso",
            "driverPlate" to "B 4920 SAK"
        )
        orderRef.updateChildren(updates)
    }

    fun rejectOrder(orderId: String) {
        _incomingOrder.value = null
    }

    fun updateTripStep(orderId: String, step: String) {
        val updates = hashMapOf<String, Any>("tripStep" to step)
        if (step == "ON_THE_WAY") updates["status"] = "ON_TRIP"
        if (step == "COMPLETED") {
            updates["status"] = "COMPLETED"
            updates["paymentStatus"] = "PAID"
        }
        database.getReference("orders/\$orderId").updateChildren(updates)
    }
}`
  },
  {
    name: 'AndroidManifest.xml',
    language: 'xml',
    category: 'android',
    description: 'Izin Lokasi, Foreground Service, dan Konfigurasi Google Maps API',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Izin Lokasi & Background Location -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Ojek Driver"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="\${MAPS_API_KEY}" />

        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".DriverLocationService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="location" />

    </application>
</manifest>`
  },
  {
    name: 'database.rules.json',
    language: 'json',
    category: 'firebase',
    description: 'Aturan Keamanan Firebase Realtime Database (Atomic status transitions)',
    code: `{
  "rules": {
    ".read": "auth != null",
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $userId"
      }
    },
    "drivers": {
      "$driverId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $driverId",
        "location": {
          ".write": "auth != null && auth.uid === $driverId",
          ".validate": "newData.hasChildren(['lat', 'lng', 'updatedAt'])"
        }
      }
    },
    "orders": {
      ".indexOn": ["status", "customerId", "driverId", "createdAt"],
      "$orderId": {
        ".read": "auth != null",
        ".write": "auth != null && (
          (!data.exists() && newData.child('customerId').val() === auth.uid && newData.child('status').val() === 'SEARCHING') ||
          (data.exists() && data.child('customerId').val() === auth.uid && newData.child('status').val() === 'CANCELLED') ||
          (data.exists() && data.child('status').val() === 'SEARCHING' && newData.child('status').val() === 'ACCEPTED' && newData.child('driverId').val() === auth.uid) ||
          (data.exists() && data.child('driverId').val() === auth.uid)
        )"
      }
    }
  }
}`
  },
  {
    name: 'firebase_schema.json',
    language: 'json',
    category: 'firebase',
    description: 'Skema JSON Database Realtime Sinkronisasi (/users, /drivers, /orders)',
    code: `{
  "users": {
    "usr_cust_8829": {
      "userId": "usr_cust_8829",
      "name": "Rian Pratama",
      "phone": "0812-9876-5432",
      "rating": 4.95
    }
  },
  "drivers": {
    "drv_mitra_1092": {
      "driverId": "drv_mitra_1092",
      "name": "Budi Santoso",
      "phone": "0857-1122-3344",
      "plateNumber": "B 4920 SAK",
      "isOnline": true,
      "location": {
        "lat": -6.182012,
        "lng": 106.825045,
        "heading": 45,
        "updatedAt": 1726000005000
      }
    }
  },
  "orders": {
    "ord_84920a": {
      "orderId": "ord_84920a",
      "customerId": "usr_cust_8829",
      "driverId": "drv_mitra_1092",
      "origin": { "name": "Stasiun Gambir", "lat": -6.1767, "lng": 106.8306 },
      "destination": { "name": "Grand Indonesia", "lat": -6.1950, "lng": 106.8208 },
      "distanceKm": 3.4,
      "totalFare": 13500,
      "status": "SEARCHING",
      "paymentMethod": "CASH",
      "createdAt": 1726000010000
    }
  }
}`
  },
  {
    name: 'SETUP_AND_GITHUB_GUIDE.md',
    language: 'markdown',
    category: 'guide',
    description: 'Langkah demi langkah menghubungkan kedua kode ke Firebase & GitHub',
    code: `# Panduan Integrasi Firebase & GitHub MVP Ojek Online

## 1. Setup Firebase Bersama
1. Buka console.firebase.google.com -> Buat Proyek (ojek-online-mvp)
2. Aktifkan Authentication (Anonymous / Phone)
3. Aktifkan Realtime Database di region asia-southeast1
4. Copy-paste aturan database.rules.json ke tab Rules

## 2. Setup Android Driver (Kotlin)
1. Daftarkan com.ojek.driver di Firebase Console
2. Jalankan ./gradlew signingReport untuk mendapatkan SHA-1
3. Download google-services.json dan letakkan di apps/driver-android/app/
4. Dapatkan Google Maps API Key dari Google Cloud Console

## 3. Setup Web Pelanggan (React/Next.js)
1. Daftarkan Web App di Firebase Console
2. Simpan konfigurasi ke .env.local (NEXT_PUBLIC_FIREBASE_*)
3. Aktifkan Places API (New) & Routes API di Google Cloud Console

## 4. GitHub Setup
\`\`\`bash
git init
git add .
git commit -m "feat: initial MVP ojek online dual app architecture"
git remote add origin https://github.com/username/ojek-online-mvp.git
git push -u origin main
\`\`\`
`
  }
];
