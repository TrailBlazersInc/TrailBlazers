package com.example.cpen321project

import RecommendationAdapter
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
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
import java.math.BigDecimal

data class RecommendationItem(
    val rank: Int,
    val score: Double,
    val email: String,
    val name: String,
    val pace: Int,
    val distance: String,
    val time: String
)

private lateinit var recommendationRecyclerView: RecyclerView
private lateinit var recommendationAdapter: RecommendationAdapter


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
    private lateinit var userToken : String
    private lateinit var userEmail : String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_recommendation)

        recommendationRecyclerView = findViewById(R.id.recommendationRecyclerView)
        recommendationRecyclerView.layoutManager = LinearLayoutManager(this)


        // Initialize UI elements
        inputLocationWeight = findViewById(R.id.inputLocationWeight)
        inputSpeedWeight = findViewById(R.id.inputSpeedWeight)
        inputDistanceWeight = findViewById(R.id.inputDistanceWeight)
        getRecommendationButton = findViewById(R.id.getRecommendationButton)
        progressBar = findViewById(R.id.progressBar)
        resultTextView = findViewById(R.id.resultTextView)

        // Retrieve user token and email from intent
        userToken = intent.extras?.getString("tkn") ?: ""
        userEmail = intent.extras?.getString("email") ?: ""

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
            .baseUrl(BuildConfig.BACKEND_URL)  // Adjust URL if needed
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        // Make API call with Authorization header
        userToken?.let { token ->
            userEmail?.let { userEmail ->
                apiService.getRecommendations("Bearer $userToken", userEmail, requestBody).enqueue(object : Callback<ResponseBody> {
                    override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                        progressBar.visibility = View.GONE
                        if (response.isSuccessful) {
                            val responseString = response.body()?.string()
                            Log.d(TAG, "API Response: $responseString")

                            try {
                                val jsonObject = JSONObject(responseString.toString())
                                val recommendationsArray = jsonObject.getJSONArray("recommendations")

                                val recommendationsList = mutableListOf<RecommendationItem>()

                                for (i in 0 until recommendationsArray.length()) {
                                    val rec = recommendationsArray.getJSONObject(i)
                                    val rank = i + 1 // Assign rank based on order
                                    val score = rec.getDouble("matchScore")
                                    Log.d(TAG, "matchScore: $score")
                                    val name = "${rec.getString("firstName")} ${rec.getString("lastName")}"
                                    val pace = rec.getInt("pace")
                                    val distance = rec.getString("distance")
                                    val time = rec.getString("time")
                                    val email = rec.getString("email")

                                    recommendationsList.add(RecommendationItem(rank, score, email, name, pace, distance, time))
                                }

                                // Update the RecyclerView with parsed data
                                updateRecyclerView(recommendationsList)

                            } catch (e: Exception) {
                                Log.e(TAG, "Error parsing response: ${e.message}")
                                resultTextView.text = "Error parsing response!"
                            }
                        } else {
                            Log.e(TAG, "API call failed")
                            resultTextView.text = "Error: ${response.code()}"
                        }
                        resultTextView.text = "Result is..."
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

    private fun updateRecyclerView(recommendationsList: List<RecommendationItem>) {
        recommendationAdapter = RecommendationAdapter(recommendationsList, userToken, userEmail, this)
        recommendationRecyclerView.adapter = recommendationAdapter
    }
}



