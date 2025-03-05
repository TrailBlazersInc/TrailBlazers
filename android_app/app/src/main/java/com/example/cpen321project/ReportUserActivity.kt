package com.example.cpen321project

import android.os.Bundle
import android.widget.Button
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONObject

class ReportUserActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report_user)

        val reportButton = findViewById<Button>(R.id.report_button)
        val reasonSpinner = findViewById<Spinner>(R.id.reason_spinner)

        val extras = intent.extras
        val reportedUserId = extras?.getString("reportedUseremail") ?: ""
        val tkn = extras?.getString("tkn") ?: ""
        val chatId = extras?.getString("chatId") ?: ""

        reportButton.setOnClickListener {
            val selectedReason = reasonSpinner.selectedItem.toString()
            if (reportedUserId.isNotEmpty()) {
                submitReport(reportedUserId, selectedReason, tkn, email)
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
}
