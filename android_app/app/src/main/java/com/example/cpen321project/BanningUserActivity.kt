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

class BanningUserActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_banning_user)

        val banButton = findViewById<Button>(R.id.ban_button)
        val userSpinner = findViewById<Spinner>(R.id.user_spinner)

        val extras = intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""

        banButton.setOnClickListener {
            val selectedUser = userSpinner.selectedItem.toString()
            if (selectedUser.isNotEmpty()) {
                banUser(selectedUser, tkn, email)
            } else {
                Toast.makeText(this, "Error: No user selected.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun banUser(userId: String, tkn: String, email: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val jsonObject = JSONObject()
                jsonObject.put("bannedUserId", userId)
                jsonObject.put("token", tkn)
                jsonObject.put("email", email)

                val requestBody = RequestBody.create(MediaType.get("application/json; charset=utf-8"), jsonObject.toString())

                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("http://10.0.2.2:3000/ban") // Replace with actual API endpoint
                    .post(requestBody)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    runOnUiThread {
                        Toast.makeText(this@BanningUserActivity, "User banned successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this@BanningUserActivity, "Failed to ban user", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this@BanningUserActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
