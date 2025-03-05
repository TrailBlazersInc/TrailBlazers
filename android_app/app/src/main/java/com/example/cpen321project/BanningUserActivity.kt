package com.example.cpen321project

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.cpen321andriodapp.ApiService
import com.example.cpen321project.MainActivity.Companion
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONArray
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class BanningUserActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "BanningUserActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_banning_user)

        val banButton = findViewById<Button>(R.id.ban_button)
        val userSpinner = findViewById<Spinner>(R.id.user_spinner)

        val extras = intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""

        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        val call = apiService.getReport("Bearer $tkn")

        val emailList = mutableListOf<String>()
        var userBan: String? = null

        call.enqueue(object : Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val responseString = response.body()?.string()
                    Log.d(TAG, "Response: $responseString")
                    val jsonArray =  JSONArray(responseString)


                    for (i in 0 until jsonArray.length()) {
                        val report = jsonArray.getJSONObject(i)
                        val aggressorEmail = report.optString("agressrEmail", "")
                        if (aggressorEmail.isNotEmpty()) {
                            emailList.add(aggressorEmail)
                        }
                    }

                    // Update the spinner on the main thread
                    runOnUiThread {
                        val adapter = ArrayAdapter(this@BanningUserActivity, android.R.layout.simple_spinner_item, emailList)
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

        userSpinner.onItemSelectedListener = object :
            AdapterView.OnItemSelectedListener {
            override fun onItemSelected(
                parent: AdapterView<*>,
                view: View, position: Int, id: Long
            ) {
                Log.d(TAG, emailList[position])
                userBan = emailList[position]
            }
            override fun onNothingSelected(parent: AdapterView<*>) {
                // Do Nothing
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
                    }
                }
                override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                    Toast.makeText(this@BanningUserActivity, "Unable to Ban User", Toast.LENGTH_SHORT).show()
                    Log.d(TAG,"Request failed: ${t.message}")
                }
            })
        }
    }

//    private fun banUser(userId: String, tkn: String, email: String) {
//        CoroutineScope(Dispatchers.IO).launch {
//            try {
//                val jsonObject = JSONObject()
//                jsonObject.put("bannedUserId", userId)
//                jsonObject.put("token", tkn)
//                jsonObject.put("email", email)
//
//                val requestBody = RequestBody.create(MediaType.get("application/json; charset=utf-8"), jsonObject.toString())
//
//                val client = OkHttpClient()
//                val request = Request.Builder()
//                    .url("http://10.0.2.2:3000/ban") // Replace with actual API endpoint
//                    .post(requestBody)
//                    .build()
//
//                val response = client.newCall(request).execute()
//                if (response.isSuccessful) {
//                    runOnUiThread {
//                        Toast.makeText(this@BanningUserActivity, "User banned successfully", Toast.LENGTH_SHORT).show()
//                        finish()
//                    }
//                } else {
//                    runOnUiThread {
//                        Toast.makeText(this@BanningUserActivity, "Failed to ban user", Toast.LENGTH_SHORT).show()
//                    }
//                }
//            } catch (e: Exception) {
//                runOnUiThread {
//                    Toast.makeText(this@BanningUserActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
//                }
//            }
//        }
//    }
}
