package com.example.cpen321project

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.cpen321andriodapp.ApiService
import okhttp3.ResponseBody
import org.json.JSONArray
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class BanningUserActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "BanningUserActivity"
    }

    private val reportsList = mutableListOf<Pair<String, String>>()
    private val reportCategories = listOf("Harassment", "Spam", "Inappropriate Content", "Other")


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_banning_user)

        val banButton = findViewById<Button>(R.id.ban_button)
        val userSpinner = findViewById<Spinner>(R.id.user_spinner)
        val reportsTextView = findViewById<TextView>(R.id.reports_textview)

        val extras = intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

        val call = apiService.getReport("Bearer $tkn")
        val emailSet = LinkedHashSet<String>()

        var emailList = mutableListOf<String>()
        var userBan: String? = null

        call.enqueue(object : Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val responseString = response.body()?.string()
                    Log.d(TAG, "Response: $responseString")
                    val jsonArray = JSONArray(responseString)

                    reportsList.clear()
                    emailSet.clear()

                    for (i in 0 until jsonArray.length()) {
                        val report = jsonArray.getJSONObject(i)
                        val aggressorEmail = report.optString("agressrEmail", "")
                        val description = report.optString("description", "Other")
                        if (aggressorEmail.isNotEmpty()) {
                            val normalizedDescription = when {
                                description.contains("Harassment", true) -> "Harassment"
                                description.contains("Spam", true) -> "Spam"
                                description.contains("Inappropriate", true) -> "Inappropriate Content"
                                else -> "Other"
                            }
                            reportsList.add(Pair(aggressorEmail, description))
                            emailSet.add(aggressorEmail)
                        }
                    }

                    emailList = ArrayList(emailSet)

                    runOnUiThread {
                        val adapter = ArrayAdapter(
                            this@BanningUserActivity,
                            android.R.layout.simple_spinner_item,
                            emailList
                        )
                        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                        userSpinner.adapter = adapter
                    }
                } else {
                    Log.d(TAG, "Request failed: ${response.code()}")
                    Toast.makeText(this@BanningUserActivity, "Error getting ban requests", Toast.LENGTH_SHORT)
                        .show()
                }

            }
            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@BanningUserActivity, "Unable to Get User List", Toast.LENGTH_SHORT).show()
                Log.d(TAG,"Request failed: ${t.message}")
            }
        })

        userSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>,
                view: View, position: Int, id: Long
            ) {
                val selectedEmail = parent.getItemAtPosition(position).toString()
                userBan = selectedEmail

                val userReports = reportsList.filter { it.first == selectedEmail }

                val counts = reportCategories.associateWith { category ->
                    userReports.count { it.second == category }
                }

                val countsText = buildString {
                    counts.forEach { (category, count) ->
                        append("$category: $count\n\n")
                    }
                }

                reportsTextView.text = countsText
            }

            override fun onNothingSelected(parent: AdapterView<*>) {
                reportsTextView.text = ""
            }
        }

        banButton.setOnClickListener {
            Log.d(TAG, "Attempting to ban user: $userBan")

            val banRequest = apiService.banUser("Bearer $tkn", userBan ?: "")

            banRequest.enqueue(object : Callback<ResponseBody> {
                override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                    if (response.isSuccessful) {
                        val responseString = response.body()?.string()
                        Log.d(TAG, "Response: $responseString")
                        Toast.makeText(this@BanningUserActivity, "User banned", Toast.LENGTH_SHORT)
                            .show()
                    }
                    else {
                        Log.d(TAG, "Request failed: ${response.code()}")
                        Toast.makeText(this@BanningUserActivity, "User already banned", Toast.LENGTH_SHORT)
                            .show()
                    }
                }
                override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                    Toast.makeText(this@BanningUserActivity, "Unable to Ban User", Toast.LENGTH_SHORT).show()
                    Log.d(TAG,"Request failed: ${t.message}")
                }
            })
        }
    }
}
