package com.ojek.driver

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
        private const val UPDATE_INTERVAL_MS = 2500L // Kirim GPS setiap 2.5 detik
        private const val FASTEST_INTERVAL_MS = 1500L
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
        intent?.getStringExtra("DRIVER_ID")?.let {
            driverId = it
        }

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
        ).apply {
            setMinUpdateIntervalMillis(FASTEST_INTERVAL_MS)
            setWaitForAccurateLocation(false)
        }.build()

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }

    private fun updateLocationToFirebase(location: Location) {
        val driverLocationRef = database.getReference("drivers/$driverId/location")

        val locationData = hashMapOf(
            "lat" to location.latitude,
            "lng" to location.longitude,
            "heading" to location.bearing,
            "accuracyMeters" to location.accuracy,
            "updatedAt" to System.currentTimeMillis()
        )

        // Tulis ke Firebase Realtime Database
        driverLocationRef.setValue(locationData)
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ojek Online Mitra Driver")
            .setContentText("Pelacakan GPS aktif: Memperbarui koordinat setiap 2.5 detik")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Driver GPS Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifikasi status background service pelacakan lokasi driver ojek"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
