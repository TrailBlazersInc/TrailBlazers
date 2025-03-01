package com.example.cpen321project

import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.example.cpen321andriodapp.ApiService
import com.example.cpen321project.MainActivity.Companion
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.*
import retrofit2.converter.gson.GsonConverterFactory

class Recommendation : AppCompatActivity() {

    companion object {
        private const val TAG = "RecommendationActivity"
    }

    private lateinit var inputLocationWeight: EditText
    private lateinit var inputSpeedWeight: EditText
    private lateinit var inputDistanceWeight: EditText
    private lateinit var getRecommendationButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var resultTextView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_recommendation)

        // Initialize UI elements
        inputLocationWeight = findViewById(R.id.inputLocationWeight)
        inputSpeedWeight = findViewById(R.id.inputSpeedWeight)
        inputDistanceWeight = findViewById(R.id.inputDistanceWeight)
        getRecommendationButton = findViewById(R.id.getRecommendationButton)
        progressBar = findViewById(R.id.progressBar)
        resultTextView = findViewById(R.id.resultTextView)

        // Retrieve user token and email from intent
        val userToken = intent.extras?.getString("tkn")
        val userEmail = intent.extras?.getString("email")

        getRecommendationButton.setOnClickListener {
            getRecommendations(userToken, userEmail)
        }
    }

    private fun getRecommendations(userToken: String?, userEmail: String?) {
        val locationWeight = inputLocationWeight.text.toString().toIntOrNull()
        val speedWeight = inputSpeedWeight.text.toString().toIntOrNull()
        val distanceWeight = inputDistanceWeight.text.toString().toIntOrNull()

        if (locationWeight == null || speedWeight == null || distanceWeight == null) {
            Toast.makeText(this, "Please enter valid weights (0-10)", Toast.LENGTH_SHORT).show()
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

        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            jsonObject.toString()
        )

        // Setup Retrofit
        val retrofit = Retrofit.Builder()
            .baseUrl("http://10.0.2.2:3000/")  // Adjust URL if needed
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        // Make API call with Authorization header
        userToken?.let { token ->
            userEmail?.let { userEmail ->
                apiService.getRecommendations("Bearer $token", userEmail, requestBody).enqueue(object : Callback<ResponseBody> {
                    override fun onResponse(
                        call: Call<ResponseBody>,
                        response: Response<ResponseBody>
                    ) {
                        progressBar.visibility = View.GONE
                        if (response.isSuccessful) {
                            val responseString = response.body()?.string()
                            resultTextView.text = "Recommended Buddies:\n$responseString"
                        } else {
                            Log.e(TAG, "API call failed")
                            resultTextView.text = "Error: ${response.code()}"
                        }
                    }

                    override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                        progressBar.visibility = View.GONE
                        resultTextView.text = "Failed to fetch recommendations: ${t.message}"
                        Log.e(TAG, "API Call Failed: ${t.message}")
                    }
                })
            }
        } ?: run {
            progressBar.visibility = View.GONE
            resultTextView.text = "Error: User not authenticated!"
        }
    }
}
