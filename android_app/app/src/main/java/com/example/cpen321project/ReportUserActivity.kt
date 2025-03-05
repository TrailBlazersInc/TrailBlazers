package com.example.cpen321project

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.cpen321andriodapp.ApiService
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
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

data class chatUser(
    val email: String,
    val name: String
)

class ReportUserActivity : AppCompatActivity() {
    private lateinit var chatId : String
    private var chatUsers: MutableList<chatUser> = mutableListOf()
    lateinit var userEmail: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report_user)

        val reportButton = findViewById<Button>(R.id.report_button)
        val reasonSpinner = findViewById<Spinner>(R.id.reason_spinner)


        val extras = intent.extras
        val reportedUserId = extras?.getString("reportedUseremail") ?: ""
        val tkn = extras?.getString("tkn") ?: ""
        chatId = extras?.getString("chatId") ?: ""
        userEmail = extras?.getString("email") ?: ""

        reportButton.setOnClickListener {
            val selectedReason = reasonSpinner.selectedItem.toString()
            if (reportedUserId.isNotEmpty()) {
                submitReport(reportedUserId, selectedReason, tkn, userEmail)
            } else {
                Toast.makeText(this, "Error: No user selected.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun submitReport(userId: String, reason: String, tkn: String, email: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val jsonObject = JSONObject()
                jsonObject.put("reportedUserId", userId)
                jsonObject.put("reason", reason)
                jsonObject.put("token", tkn)
                jsonObject.put("email", email)

                val requestBody = RequestBody.create(MediaType.get("application/json; charset=utf-8"), jsonObject.toString())

                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("http://10.0.2.2:3000/report") // Replace with actual API endpoint
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    runOnUiThread {
                        Toast.makeText(this@ReportUserActivity, "Report submitted successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this@ReportUserActivity, "Failed to submit report", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this@ReportUserActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun setUsers(token: String, email: String, spinner: Spinner){
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        apiService.getChatMembers("Bearer $token", chatId).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatListType = object : TypeToken<List<chatUser>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val UserList: List<chatUser> = gson.fromJson(responseString, chatListType)
                    for (user in UserList){
                        if (user.email != email){
                            chatUsers.add(user)
                        }
                    }

                } else {
                    Toast.makeText(this@ReportUserActivity, "Unable to get Members", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ReportUserActivity, "Unable to Get Members", Toast.LENGTH_SHORT).show()
                Log.d("ReportUsers","Request failed: ${t.message}")
            }
        })
    }

}
