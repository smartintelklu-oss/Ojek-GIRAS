# Panduan Lengkap Setup MVP Ojek Online (Dual App & Single Firebase Backend)

Panduan ini menjelaskan langkah demi langkah cara menghubungkan **Aplikasi Pelanggan (Web/React/Next.js)** dan **Aplikasi Driver (Android Native Kotlin Jetpack Compose)** ke satu proyek backend **Firebase** dan repositori **GitHub**.

---

## 1. STRUKTUR DIREKTORI REPOSITORI (REKOMENDASI MONOREPO)

```
ojek-online-mvp/
├── apps/
│   ├── customer-web/            # Aplikasi Pemesanan Penumpang (Next.js / React)
│   │   ├── src/
│   │   │   ├── app/page.tsx     # Layar pemesanan & pelacakan
│   │   │   └── lib/firebase.ts  # Inisialisasi Firebase Web SDK
│   │   ├── .env.local           # Kunci API Web & Firebase config
│   │   └── package.json
│   │
│   └── driver-android/          # Aplikasi Driver Mitra (Kotlin Jetpack Compose)
│       ├── app/
│       │   ├── src/main/java/com/ojek/driver/
│       │   │   ├── MainActivity.kt            # Layar Utama Compose
│       │   │   ├── DriverViewModel.kt         # Listener /orders & state
│       │   │   └── DriverLocationService.kt   # FusedLocation GPS Service
│       │   ├── google-services.json           # File konfigurasi Firebase Android
│       │   └── build.gradle.kts
│       └── build.gradle.kts
│
├── backend/
│   ├── database.rules.json      # Aturan Keamanan Firebase Realtime Database
│   ├── firestore.rules          # Aturan Keamanan Firestore (Alternatif)
│   └── firebase_schema.json     # Skema referensi struktur JSON
│
├── .gitignore
└── README.md
```

---

## 2. LANGKAH 1: SETUP PROYEK FIREBASE BERSAMA

1. Kunjungi [Firebase Console](https://console.firebase.google.com/) dan klik **"Add Project"** (contoh: `ojek-online-mvp`).
2. **Aktifkan Authentication**:
   - Masuk ke menu **Build > Authentication > Sign-in method**.
   - Aktifkan provider: **Anonymous** (untuk kemudahan testing MVP) atau **Phone / Email**.
3. **Aktifkan Realtime Database**:
   - Masuk ke **Build > Realtime Database > Create Database**.
   - Pilih region terdekat (misal: `asia-southeast1` Singapura).
   - Masuk ke tab **Rules**, lalu copy-paste aturan keamanan dari `database.rules.json` dan klik **Publish**.

---

## 3. LANGKAH 2: SETUP APLIKASI DRIVER (ANDROID NATIVE)

1. Di Firebase Console, klik icon **Android** untuk menambahkan aplikasi:
   - **Android package name**: `com.ojek.driver` (harus sama persis dengan di `build.gradle.kts`).
   - **Debug signing certificate SHA-1**:
     - Buka terminal di project Android, jalankan:
       ```bash
       ./gradlew signingReport
       ```
     - Salin kode SHA-1 debug dan tempelkan di Firebase Console.
2. Unduh file **`google-services.json`**.
3. Pindahkan file `google-services.json` ke dalam folder `apps/driver-android/app/`.
4. Dapatkan Google Maps API Key:
   - Kunjungi [Google Cloud Console](https://console.cloud.google.com/).
   - Aktifkan **Maps SDK for Android**.
   - Masukkan API Key ke `local.properties`:
     ```properties
     MAPS_API_KEY=AIzaSyYourAndroidMapsApiKey
     ```

---

## 4. LANGKAH 3: SETUP APLIKASI PELANGGAN (WEB / REACT / NEXT.JS)

1. Di Firebase Console, klik icon **Web (</>)** untuk mendaftarkan web app.
2. Salin objek `firebaseConfig` yang diberikan.
3. Buat file `apps/customer-web/.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ojek-online-mvp.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://ojek-online-mvp-default-rtdb.asia-southeast1.firebasedatabase.app"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="ojek-online-mvp"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ojek-online-mvp.firebasestorage.app"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

   # Google Maps Platform Web Key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
   ```
4. Di Google Cloud Console, pastikan API berikut sudah aktif:
   - **Maps JavaScript API**
   - **Places API (New)**
   - **Routes API**

---

## 5. LANGKAH 4: MENGHUBUNGKAN KE GITHUB

1. Inisialisasi Git di root folder proyek:
   ```bash
   git init
   git branch -M main
   ```
2. Pastikan file sensitif tidak ter-commit di `.gitignore`:
   ```
   # Node
   node_modules/
   .next/
   .env*.local

   # Android
   .gradle/
   build/
   local.properties
   google-services.json
   *.keystore
   ```
3. Commit dan push ke repositori GitHub:
   ```bash
   git add .
   git commit -m "feat: initial MVP ojek online dual app architecture"
   git remote add origin https://github.com/username/ojek-online-mvp.git
   git push -u origin main
   ```

---

## 6. CARA KERJA SINKRONISASI REAL-TIME

1. **Penumpang Klik "Pesan Ojek"**:
   - Web App mengirim node baru ke `/orders/{orderId}` dengan `status: "SEARCHING"`.
2. **Driver Listener Mendeteksi Order**:
   - Android App yang sedang **ONLINE** mendengarkan query `orders.orderByChild("status").equalTo("SEARCHING")`.
   - Pop-up modal "Order Masuk" muncul seketika di layar HP Driver dengan timer 30 detik.
3. **Driver Klik "Terima"**:
   - Android App mengupdate `/orders/{orderId}`:
     - `status: "ACCEPTED"`
     - `driverId: "drv_mitra_1092"`
     - `tripStep: "HEADING_TO_PICKUP"`
   - Web App Penumpang mendengarkan perubahan status dan langsung menampilkan profil driver & plat motor.
4. **GPS Tracking Real-Time**:
   - `DriverLocationService` membaca koordinat GPS driver setiap 2.5 detik dan mengupdate `/drivers/{driverId}/location`.
   - Web App Penumpang membaca node lokasi tersebut dan menganimasikan posisi marker motor di peta Google Maps.
5. **Penyelesaian & Pembayaran Tunai**:
   - Driver menekan tombol "Selesai (Terima Cash)".
   - Status order berubah menjadi `COMPLETED` dan `paymentStatus: "PAID"`.
