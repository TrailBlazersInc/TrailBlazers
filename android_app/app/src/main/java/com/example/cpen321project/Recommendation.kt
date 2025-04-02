package com.example.cpen321project

import RecommendationAdapter
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321andriodapp.ApiService
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.material.snackbar.Snackbar;
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONException
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

// Add a new interface for location update API
interface LocationUpdateService {
    @POST("/api/users/location/{email}")
    fun updateUserLocation(
        @Header("Authorization") token: String,
        @Path("email") email: String,
        @Body locationData: RequestBody
    ): Call<ResponseBody>
}

data class Availability(
    val monday: Boolean,
    val tuesday: Boolean,
    val wednesday: Boolean,
    val thursday: Boolean,
    val friday: Boolean,
    val saturday: Boolean,
    val sunday: Boolean
)

data class RecommendationItem(
    val rank: Int,
    val score: Double,
    val email: String,
    val name: String,
    val pace: Int,
    val distance: String,
    val time: String,
    val latitude: Double,
    val longitude: Double,
    val availability: Availability
)

private lateinit var recommendationRecyclerView: RecyclerView
private lateinit var recommendationAdapter: RecommendationAdapter

class Recommendation : AppCompatActivity() {

    companion object {
        private const val TAG = "RecommendationActivity"
        private const val LOCATION_PERMISSION_REQUEST_CODE = 1001
    }

    private lateinit var rootView: View
    private lateinit var backButton: ImageView
    private lateinit var inputLocationWeight: EditText
    private lateinit var inputSpeedWeight: EditText
    private lateinit var inputDistanceWeight: EditText
    private lateinit var inputAvailabilityWeight: EditText
    private lateinit var getLocationPermissionButton: Button
    private lateinit var getRecommendationButton: Button
    private lateinit var viewOnMapButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var resultTextView: TextView
    private var recommendationsList = mutableListOf<RecommendationItem>()
    private lateinit var userToken: String
    private lateinit var userEmail: String
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    var invalidWeightsErrorShown = false
    var locationPermissionDenied = false
    var noMatchesFound = false
    var apiCallFailed = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_recommendation)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        rootView = findViewById(android.R.id.content)

        // Initialize FusedLocationProviderClient
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        recommendationRecyclerView = findViewById(R.id.recommendationRecyclerView)
        recommendationRecyclerView.layoutManager = LinearLayoutManager(this)

        // Initialize UI elements
        backButton = findViewById(R.id.chevron_left)
        inputLocationWeight = findViewById(R.id.inputLocationWeight)
        inputSpeedWeight = findViewById(R.id.inputSpeedWeight)
        inputDistanceWeight = findViewById(R.id.inputDistanceWeight)
        inputAvailabilityWeight = findViewById(R.id.inputAvailabilityWeight)
        getLocationPermissionButton = findViewById(R.id.getLocationPermissionButton)
        getRecommendationButton = findViewById(R.id.getRecommendationButton)
        viewOnMapButton = findViewById(R.id.viewOnMapButton)
        progressBar = findViewById(R.id.progressBar)
        resultTextView = findViewById(R.id.resultTextView)

        // Retrieve user token and email from intent
        userToken = intent.extras?.getString("tkn") ?: ""
        userEmail = intent.extras?.getString("email") ?: ""

        getLocationPermissionButton.setOnClickListener {
            checkAndUpdateLocation()
        }

        backButton.setOnClickListener {
            intent = Intent(this, HomeActivity::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("email", userEmail)
            startActivity(intent)
        }

        getRecommendationButton.setOnClickListener {
            getRecommendations(userToken, userEmail)
        }

        viewOnMapButton.setOnClickListener {
            val intent = Intent(this, MapsActivity::class.java)
            val latitudes = recommendationsList.map { it.latitude }.toDoubleArray()
            val longitudes = recommendationsList.map { it.longitude }.toDoubleArray()

            // Get current user's location for MapActivity
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                fusedLocationClient.lastLocation
                    .addOnSuccessListener { location: Location? ->
                        location?.let {
                            intent.putExtra("currentUserLatitude", it.latitude)
                            intent.putExtra("currentUserLongitude", it.longitude)
                        }
                        intent.putExtra("latitudes", latitudes)
                        intent.putExtra("longitudes", longitudes)
                        startActivity(intent)
                    }
                    .addOnFailureListener {
                        // Fallback if location retrieval fails
                        intent.putExtra("latitudes", latitudes)
                        intent.putExtra("longitudes", longitudes)
                        startActivity(intent)
                    }
            } else {
                // If location permission not granted, just start MapActivity with recommendations
                intent.putExtra("latitudes", latitudes)
                intent.putExtra("longitudes", longitudes)
                startActivity(intent)
            }
        }
    }

    private fun showSnackbar(message: String) {
        Snackbar.make(rootView, message, Snackbar.LENGTH_SHORT).show()
    }

    private fun checkAndUpdateLocation() {
        when {
            ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED && ContextCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED -> {
                // Permissions granted, proceed with location update
                updateUserLocation()
            }

            shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION) ||
                    shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_COARSE_LOCATION) -> {
                // Show rationale and request permissions
                showLocationPermissionRationale()
            }

            else -> {
                // Request permissions
                requestLocationPermissions()
            }
        }
    }


    private fun updateUserLocation() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            showSnackbar("Location permission not granted")
            return
        }

        fusedLocationClient.lastLocation
            .addOnSuccessListener { location: Location? ->
                location?.let {
                    val latitude = it.latitude
                    val longitude = it.longitude

                    // Create JSON payload for location
                    val jsonObject = JSONObject().apply {
                        put("latitude", latitude)
                        put("longitude", longitude)
                    }

                    val jsonString = jsonObject.toString()  // Get the JSON string
                    Log.d(TAG, "JSON Payload: $jsonString") // Log the JSON string

                    val requestBody = RequestBody.create(
                        MediaType.parse("application/json"),
                        jsonString
                    )

                    // Setup Retrofit for location update

                    val locationUpdateService = RetrofitClient.getClient(this).create(LocationUpdateService::class.java)

                    // Make API call to update location
                    locationUpdateService.updateUserLocation(
                        "Bearer $userToken",
                        userEmail,
                        requestBody
                    ).enqueue(object : Callback<ResponseBody> {
                        override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                            if (response.isSuccessful) {
                                showSnackbar("Location updated successfully")
                            } else {
                                Log.e(TAG, "Failed to update location. Response code: ${response.code()}")
                                Log.e(TAG, "Response body: ${response.errorBody()?.string()}") // Log error response
                                showSnackbar("Failed to update location")
                            }
                        }

                        override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                            Log.e(TAG, "Network error updating location: ${t.message}")
                            showSnackbar("Network error updating location")
                        }
                    })
                } ?: run {
                    showSnackbar("Unable to get location")
                }
            }
            .addOnFailureListener {
                showSnackbar("Location retrieval failed")
            }
    }



    private fun requestLocationPermissions() {
        requestPermissions(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            LOCATION_PERMISSION_REQUEST_CODE
        )
    }

    private fun showLocationPermissionRationale() {
        AlertDialog.Builder(this)
            .setMessage("Location permission is required to update and show your location")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
                requestLocationPermissions()
            }.setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
                showSnackbar("Please grant the location permissions")
                locationPermissionDenied = true
            }.show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED &&
                grantResults[1] == PackageManager.PERMISSION_GRANTED
            ) {
                // Permissions granted, update location
                updateUserLocation()
            } else {
                showSnackbar("Location permissions are required to use this feature")
                locationPermissionDenied = true
            }
        }
    }

    private fun getRecommendations(userToken: String?, userEmail: String?) {
        val locationWeight = inputLocationWeight.text.toString().toIntOrNull()
        val speedWeight = inputSpeedWeight.text.toString().toIntOrNull()
        val distanceWeight = inputDistanceWeight.text.toString().toIntOrNull()
        val availabilityWeight = inputAvailabilityWeight.text.toString().toIntOrNull()

        if (locationWeight == null || speedWeight == null) {
            showSnackbar("Please enter valid weights (0-10)")
            invalidWeightsErrorShown = true
            return
        }

        if (distanceWeight == null || availabilityWeight == null) {
            showSnackbar("Please enter valid weights (0-10)")
            invalidWeightsErrorShown = true
            return
        }

        // Show loading
        progressBar.visibility = View.VISIBLE
        resultTextView.text = "Fetching recommendations..."

        // Create JSON payload
        val jsonObject = JSONObject()
        jsonObject.put("locationWeight", locationWeight)
        jsonObject.put("speedWeight", speedWeight)
        jsonObject.put("distanceWeight", distanceWeight)
        jsonObject.put("availabilityWeight", availabilityWeight)

        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            jsonObject.toString()
        )

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

        // Make API call with Authorization header
        userToken?.let { token ->
            userEmail?.let { userEmail ->
                apiService.getRecommendations("Bearer $userToken", userEmail, requestBody).enqueue(object : Callback<ResponseBody> {
                    override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                        progressBar.visibility = View.GONE
                        if (response.isSuccessful) {
                            handleSuccessfulResponse(response)
                        } else {
                            Log.e(TAG, "API call failed")
                            resultTextView.text = "Error: ${response.code()}"
                            apiCallFailed = true
                        }
                    }

                    override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                        progressBar.visibility = View.GONE
                        resultTextView.text = "Failed to fetch recommendations: ${t.message}"
                        Log.e(TAG, "API Call Failed: ${t.message}")
                        apiCallFailed = true
                    }
                })
            }
        } ?: run {
            progressBar.visibility = View.GONE
            resultTextView.text = "Error: User not authenticated!"
        }
    }

    private fun handleSuccessfulResponse(response: Response<ResponseBody>) {
        val responseString = response.body()?.string()
        Log.d(TAG, "API Response: $responseString")

        try {
            val jsonObject = JSONObject(responseString.toString())

            // Check if there's a recommendation
            if (jsonObject.has("recommendation")) {
                val rec = jsonObject.getJSONObject("recommendation")
                val recommendationsList = mutableListOf<RecommendationItem>()

                // Parse recommendation details
                val score = rec.getDouble("matchScore")
                val name = "${rec.getString("firstName")} ${rec.getString("lastName")}"
                val pace = rec.getInt("pace")
                val email = rec.getString("email")
                val availability = parseAvailability(rec)

                recommendationsList.add(
                    RecommendationItem(
                        rank = 1, // Only one recommendation, so rank is 1
                        score = score,
                        email = email,
                        name = name,
                        pace = pace,
                        distance = rec.optString("distance", "N/A"),
                        time = rec.optString("time", "N/A"),
                        latitude = rec.optDouble("latitude", 0.0),
                        longitude = rec.optDouble("longitude", 0.0),
                        availability = availability
                    )
                )
                Log.d("availability:", availability.toString())

                // Update the UI
                this@Recommendation.recommendationsList = recommendationsList
                updateRecyclerView(recommendationsList)
                resultTextView.text = "Found your perfect jogging match!"
                viewOnMapButton.visibility = View.VISIBLE
            } else {
                resultTextView.text = "No suitable jogger match found. Please try again later or adjust your preferences."
                viewOnMapButton.visibility = View.GONE
                noMatchesFound = true
            }
        } catch (e: JSONException) {
            Log.e(TAG, "JSON parsing error: ${e.message}")
            resultTextView.text = "Error parsing response: ${e.message}"
        }
    }

    private fun parseAvailability(rec: JSONObject): Availability {
        return if (rec.has("availability")) {
            val availabilityObj = rec.getJSONObject("availability")
            Availability(
                monday = availabilityObj.optBoolean("monday", false),
                tuesday = availabilityObj.optBoolean("tuesday", false),
                wednesday = availabilityObj.optBoolean("wednesday", false),
                thursday = availabilityObj.optBoolean("thursday", false),
                friday = availabilityObj.optBoolean("friday", false),
                saturday = availabilityObj.optBoolean("saturday", false),
                sunday = availabilityObj.optBoolean("sunday", false)
            )
        } else {
            // Default availability if not provided
            Availability(false, false, false, false, false, false, false)
        }
    }

    private fun updateRecyclerView(recommendationsList: List<RecommendationItem>) {
        recommendationAdapter = RecommendationAdapter(recommendationsList, userToken, userEmail, this)
        recommendationRecyclerView.adapter = recommendationAdapter
    }
}



