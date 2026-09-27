package com.ojek.driver

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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

    LaunchedEffect(driverLocation) {
        cameraPositionState.position = CameraPosition.fromLatLngZoom(driverLocation, 16f)
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
                    // Tombol Switch Online / Offline
                    Switch(
                        checked = isOnline,
                        onCheckedChange = { checked ->
                            viewModel.setOnlineStatus(checked)
                            onToggleService(checked)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = Color(0xFF10B981)
                        )
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Google Maps Compose View
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = true)
            ) {
                // Marker Posisi Driver
                Marker(
                    state = MarkerState(position = driverLocation),
                    title = "Posisi Anda (Driver)",
                    snippet = "Update real-time via FusedLocationProvider"
                )

                // Marker Penjemputan & Tujuan jika ada order aktif
                activeOrder?.let { order ->
                    Marker(
                        state = MarkerState(position = LatLng(order.origin.lat, order.origin.lng)),
                        title = "Titik Jemput: ${order.origin.name}"
                    )
                    Marker(
                        state = MarkerState(position = LatLng(order.destination.lat, order.destination.lng)),
                        title = "Tujuan: ${order.destination.name}"
                    )
                }
            }

            // Bottom Panel: Info Order Aktif & Alur Tombol Perjalanan
            activeOrder?.let { order ->
                ActiveOrderBottomSheet(
                    order = order,
                    modifier = Modifier.align(Alignment.BottomCenter),
                    onUpdateStep = { nextStep ->
                        viewModel.updateTripStep(order.orderId, nextStep)
                    }
                )
            }

            // Pop-up Dialog: Order Masuk (SEARCHING)
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
fun ActiveOrderBottomSheet(
    order: OrderModel,
    modifier: Modifier = Modifier,
    onUpdateStep: (String) -> Unit
) {
    val rupiahFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
        elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(order.customerName, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                    Text("Penumpang Ojek • ${order.distanceKm} km", color = Color.Gray, fontSize = 12.sp)
                }
                Text(
                    rupiahFormat.format(order.totalFare),
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF10B981),
                    fontSize = 16.sp
                )
            }

            Divider(color = Color(0xFF334155))

            Text("📍 Jemput: ${order.origin.name}", color = Color(0xFFE2E8F0), fontSize = 13.sp)
            Text("🏁 Tujuan: ${order.destination.name}", color = Color(0xFFE2E8F0), fontSize = 13.sp)

            Spacer(modifier = Modifier.height(4.dp))

            // Alur Tombol Status Perjalanan
            when (order.tripStep) {
                "HEADING_TO_PICKUP" -> {
                    Button(
                        onClick = { onUpdateStep("ARRIVED_AT_PICKUP") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                    ) {
                        Text("Saya Sudah Tiba di Titik Jemput", fontWeight = FontWeight.Bold)
                    }
                }
                "ARRIVED_AT_PICKUP" -> {
                    Button(
                        onClick = { onUpdateStep("ON_THE_WAY") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                    ) {
                        Text("Mulai Perjalanan (Bawa Penumpang)", fontWeight = FontWeight.Bold)
                    }
                }
                "ON_THE_WAY" -> {
                    Button(
                        onClick = { onUpdateStep("ARRIVED_AT_DESTINATION") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706))
                    ) {
                        Text("Tiba di Lokasi Tujuan", fontWeight = FontWeight.Bold)
                    }
                }
                "ARRIVED_AT_DESTINATION" -> {
                    Button(
                        onClick = { onUpdateStep("COMPLETED") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Text("Selesai & Terima Cash (${rupiahFormat.format(order.totalFare)})", fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
fun IncomingOrderModal(
    order: OrderModel,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    val rupiahFormat = NumberFormat.getCurrencyInstance(Locale("id", "ID"))

    AlertDialog(
        onDismissRequest = {},
        containerColor = Color(0xFF0F172A),
        title = {
            Text("⚡ ORDER OJEK MASUK!", color = Color(0xFF10B981), fontWeight = FontWeight.Black)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Jarak Tempuh: ${order.distanceKm} km", color = Color.White, fontWeight = FontWeight.SemiBold)
                Text("Tarif Tunai: ${rupiahFormat.format(order.totalFare)}", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("Jemput: ${order.origin.name}", color = Color.LightGray, fontSize = 12.sp)
                Text("Tujuan: ${order.destination.name}", color = Color.LightGray, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                Text("Terima Order", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onReject) {
                Text("Tolak", color = Color.Red)
            }
        }
    )
}
