package com.ojek.driver

import androidx.lifecycle.ViewModel
import com.google.android.gms.maps.model.LatLng
import com.google.firebase.database.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class LocationPointModel(
    val name: String = "",
    val address: String = "",
    val lat: Double = 0.0,
    val lng: Double = 0.0
)

data class OrderModel(
    val orderId: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val driverId: String? = null,
    val origin: LocationPointModel = LocationPointModel(),
    val destination: LocationPointModel = LocationPointModel(),
    val distanceKm: Double = 0.0,
    val durationMins: Int = 0,
    val totalFare: Long = 0,
    val status: String = "SEARCHING",
    val tripStep: String = "HEADING_TO_PICKUP",
    val paymentMethod: String = "CASH",
    val paymentStatus: String = "UNPAID"
)

class DriverViewModel : ViewModel() {

    private val database = FirebaseDatabase.getInstance()

    val driverId = MutableStateFlow("drv_mitra_1092")

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _driverLocation = MutableStateFlow(LatLng(-6.1820, 106.8250))
    val driverLocation: StateFlow<LatLng> = _driverLocation.asStateFlow()

    private val _incomingOrder = MutableStateFlow<OrderModel?>(null)
    val incomingOrder: StateFlow<OrderModel?> = _incomingOrder.asStateFlow()

    private val _activeOrder = MutableStateFlow<OrderModel?>(null)
    val activeOrder: StateFlow<OrderModel?> = _activeOrder.asStateFlow()

    private var searchingOrdersQuery: Query? = null
    private var activeOrderRef: DatabaseReference? = null

    init {
        listenToSearchingOrders()
        listenToDriverProfile()
    }

    private fun listenToDriverProfile() {
        val driverRef = database.getReference("drivers/${driverId.value}")
        driverRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val currentOrder = snapshot.child("currentOrderId").getValue(String::class.java)
                if (currentOrder != null && currentOrder.isNotEmpty()) {
                    listenToActiveOrder(currentOrder)
                } else {
                    _activeOrder.value = null
                }
            }

            override fun onCancelled(error: DatabaseError) {}
        })
    }

    // Listener untuk membaca order baru di Firebase yang berstatus "SEARCHING"
    private fun listenToSearchingOrders() {
        val ordersRef = database.getReference("orders")
        searchingOrdersQuery = ordersRef.orderByChild("status").equalTo("SEARCHING")

        searchingOrdersQuery?.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!_isOnline.value || _activeOrder.value != null) {
                    _incomingOrder.value = null
                    return
                }

                // Ambil order pertama yang ditemukan
                var candidateOrder: OrderModel? = null
                for (child in snapshot.children) {
                    val order = child.getValue(OrderModel::class.java)
                    if (order != null && order.status == "SEARCHING") {
                        candidateOrder = order
                        break
                    }
                }
                _incomingOrder.value = candidateOrder
            }

            override fun onCancelled(error: DatabaseError) {}
        })
    }

    private fun listenToActiveOrder(orderId: String) {
        activeOrderRef = database.getReference("orders/$orderId")
        activeOrderRef?.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val order = snapshot.getValue(OrderModel::class.java)
                _activeOrder.value = order
                if (order?.status == "COMPLETED" || order?.status == "CANCELLED") {
                    _activeOrder.value = null
                }
            }

            override fun onCancelled(error: DatabaseError) {}
        })
    }

    fun setOnlineStatus(online: Boolean) {
        _isOnline.value = online
        val driverOnlineRef = database.getReference("drivers/${driverId.value}/isOnline")
        driverOnlineRef.setValue(online)

        if (!online) {
            _incomingOrder.value = null
        }
    }

    fun acceptOrder(orderId: String) {
        val orderRef = database.getReference("orders/$orderId")
        val driverRef = database.getReference("drivers/${driverId.value}")

        val updates = hashMapOf<String, Any>(
            "status" to "ACCEPTED",
            "tripStep" to "HEADING_TO_PICKUP",
            "driverId" to driverId.value,
            "driverName" to "Budi Santoso",
            "driverPlate" to "B 4920 SAK",
            "driverPhone" to "0857-1122-3344",
            "acceptedAt" to ServerValue.TIMESTAMP
        )

        orderRef.updateChildren(updates).addOnSuccessListener {
            driverRef.child("currentOrderId").setValue(orderId)
            _incomingOrder.value = null
        }
    }

    fun rejectOrder(orderId: String) {
        _incomingOrder.value = null
    }

    fun updateTripStep(orderId: String, step: String) {
        val orderRef = database.getReference("orders/$orderId")
        val updates = hashMapOf<String, Any>("tripStep" to step)

        if (step == "ON_THE_WAY") {
            updates["status"] = "ON_TRIP"
            updates["startedAt"] = ServerValue.TIMESTAMP
        } else if (step == "COMPLETED") {
            updates["status"] = "COMPLETED"
            updates["completedAt"] = ServerValue.TIMESTAMP
            updates["paymentStatus"] = "PAID"

            database.getReference("drivers/${driverId.value}/currentOrderId").removeValue()
        }

        orderRef.updateChildren(updates)
    }
}
