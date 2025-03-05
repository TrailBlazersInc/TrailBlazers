package com.example.cpen321project

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

class MapsActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private val LOCATION_PERMISSION_REQUEST_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_maps)

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.mapFragment) as SupportMapFragment
        mapFragment.getMapAsync(this)
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        // Enable location layer
        enableMyLocation()

        // Get latitudes and longitudes from intent
        val latitudes = intent.getDoubleArrayExtra("latitudes") ?: doubleArrayOf()
        val longitudes = intent.getDoubleArrayExtra("longitudes") ?: doubleArrayOf()

        // Get current user's location
        val currentUserLat = intent.getDoubleExtra("currentUserLatitude", 0.0)
        val currentUserLon = intent.getDoubleExtra("currentUserLongitude", 0.0)

        // Add current user marker if location is available
        if (currentUserLat != 0.0 && currentUserLon != 0.0) {
            val currentUserLatLng = LatLng(currentUserLat, currentUserLon)
            mMap.addMarker(
                MarkerOptions()
                    .position(currentUserLatLng)
                    .title("You")
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN))
            )

            // Move camera to current user's location
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(currentUserLatLng, 12f))

            // Add nearby users within 5km
            for (i in latitudes.indices) {
                val userLatLng = LatLng(latitudes[i], longitudes[i])

                // Calculate distance
                val results = FloatArray(1)
                Location.distanceBetween(
                    currentUserLat, currentUserLon,
                    latitudes[i], longitudes[i],
                    results
                )

                // If within 5km, add marker
                if (results[0] / 1000 <= 5) {
                    mMap.addMarker(
                        MarkerOptions()
                            .position(userLatLng)
                            .title("Nearby User")
                            .snippet("Distance: ${String.format("%.2f", results[0] / 1000)} km")
                            .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED))
                    )
                }
            }
        } else {
            // If no current user location, show all recommendation markers
            for (i in latitudes.indices) {
                val userLatLng = LatLng(latitudes[i], longitudes[i])
                mMap.addMarker(
                    MarkerOptions()
                        .position(userLatLng)
                        .title("Recommendation")
                        .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED))
                )
            }

            // If recommendations exist, move camera to first recommendation
            if (latitudes.isNotEmpty()) {
                mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(latitudes[0], longitudes[0]), 12f))
            }
        }

        // Enable zoom controls
        mMap.uiSettings.isZoomControlsEnabled = true
    }

    private fun enableMyLocation() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            mMap.isMyLocationEnabled = true
        } else {
            // Request location permission
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                LOCATION_PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                enableMyLocation()
            } else {
                Toast.makeText(
                    this,
                    "Location permission is required to show your location",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}