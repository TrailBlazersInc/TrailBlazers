package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.cpen321andriodapp.ApiService
import com.google.gson.Gson
import com.google.gson.JsonParseException
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
import retrofit2.HttpException
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.IOException

data class chatUser(
    val email: String,
    val name: String
)

class ReportUserActivity : AppCompatActivity() {
    private lateinit var chatId : String
    private var chatUsers: MutableList<chatUser> = mutableListOf()
    lateinit var userEmail: String
    lateinit var userToken: String
    lateinit var chatName: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_report_user)

        val reportButton = findViewById<Button>(R.id.report_button)
        val cancelButton = findViewById<Button>(R.id.cancel_button)
        val reasonSpinner = findViewById<Spinner>(R.id.reason_spinner)
        val userSpinner = findViewById<Spinner>(R.id.user_spinner)

        val extras = intent.extras
        userToken = extras?.getString("tkn") ?: ""
        chatId = extras?.getString("chatId") ?: ""
        userEmail = extras?.getString("email") ?: ""
        setUsers(userSpinner)
        chatName = extras?.getString("chatName") ?: ""
        setUsers(userSpinner)

        reportButton.setOnClickListener {
            try {
                if(chatUsers.isNotEmpty()){
                    val selectedReason = reasonSpinner.selectedItem.toString()
                    val userIndex = userSpinner.selectedItemPosition
                    val targetEmail: String = chatUsers.get(userIndex).email
                    submitReport(targetEmail, selectedReason)
                }
            } catch (e: IOException) {
                Log.e("Report User", "Network error: ${e.message}", e)
            } catch (e: HttpException) {
                Log.e("Report User", "HTTP error: ${e.code()} - ${e.message}", e)
            } catch (e: JsonParseException) {
                Log.e("Report User", "JSON parsing error: ${e.message}", e)
            }
        }

        cancelButton.setOnClickListener {
            val intent = Intent(this, ChatActivity::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("email", userEmail)
            intent.putExtra("chatName", chatName)
            intent.putExtra("chatId", chatId)
            startActivity(intent)
        }
    }

    private fun submitReport(targetEmail: String, reason: String) {

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

        val jsonObject = JSONObject()
        jsonObject.put("aggressor_email", targetEmail)
        jsonObject.put("description", reason)

        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            jsonObject.toString()
        )

        apiService.postReport("Bearer $userToken", userEmail, requestBody).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@ReportUserActivity, "Report submitted successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@ReportUserActivity, "Failed to submit report", Toast.LENGTH_SHORT).show()
                    Log.d("ReportUsers", response.toString())
                    Log.d("ReportUsers", targetEmail)
                }
            }
            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ReportUserActivity, "Failed to submit report", Toast.LENGTH_SHORT).show()
                Log.d("ReportUsers","Request failed: ${t.message}")
            }
        })
    }

    private fun setUsers(spinner: Spinner){

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

        apiService.getChatMembers("Bearer $userToken", chatId).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatListType = object : TypeToken<List<chatUser>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val UserList: List<chatUser> = gson.fromJson(responseString, chatListType)
                    for (user in UserList){
                        if (user.email != userEmail) {
                            chatUsers.add(user)
                        }
                    }
                    val nameList = chatUsers.map { it.name }.toTypedArray()
                    val adapter = ArrayAdapter(this@ReportUserActivity, android.R.layout.simple_spinner_dropdown_item, nameList)

                    // Set dropdown style
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)

                    // Attach adapter to the Spinner
                    spinner.adapter = adapter

                } else {
                    Log.d("ReportUser", response.toString())
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
