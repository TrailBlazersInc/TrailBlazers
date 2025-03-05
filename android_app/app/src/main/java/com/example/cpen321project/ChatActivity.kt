package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.compose.material3.Text
import androidx.activity.compose.setContent
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321andriodapp.ApiService
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

data class ChatMessage (
    val id: String,
    val sender_email: String,
    val sender: String,
    val content: String,
    val date: String
)

data class chatUser(
    val email: String,
    val name: String
)
class ChatActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private var messages =mutableListOf<Message>()
    private lateinit var adapter: ChatAdapter
    private val handler = Handler(Looper.getMainLooper())
    private var lastMessageId = ""
    private var users: List<chatUser>  = emptyList()
    private lateinit var userToken: String
    private lateinit var userEmail: String
    private lateinit var chatId: String

    private companion object {
        private const val TAG = "ChatActivity"
    }

    private val updateMessagesRunnable = object : Runnable {
        private val updateInterval: Long = 2000
        override fun run() {
            updateChat(userToken, userEmail, chatId)
            // Schedule the next update
            handler.postDelayed(this, updateInterval)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_chat)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        userToken = intent.extras?.getString("tkn") ?: ""
        userEmail = intent.extras?.getString("email") ?: ""
        chatId = intent.extras?.getString("chatId")?: ""
        val chatName = intent.extras?.getString("chatName")?: ""
        val messageInput = findViewById<EditText>(R.id.messageInput)
        val sendMessageButton = findViewById<ImageView>(R.id.sendMessageButton)
        val chatNameTextView = findViewById<TextView>(R.id.manage_chats_title)
        val reportButton : Button = findViewById(R.id.reportButton)
        chatNameTextView.text = chatName
        recyclerView = findViewById(R.id.recyclerView)
        adapter = ChatAdapter(messages)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
        getMessages(userToken, userEmail, chatId)

        reportButton.setOnClickListener(){
            intent = Intent(this, ReportUserActivity::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("chatId", chatId)
            startActivity(intent)
        }


        findViewById<ImageView>(R.id.chevron_left).setOnClickListener(){
            intent = Intent(this, ManageChats::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("email", userEmail)
            startActivity(intent)
        }


        fun getToday(): String{
            val formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm")
            val currentDateTime = LocalDateTime.now().format(formatter)
            return currentDateTime
        }

        sendMessageButton.setOnClickListener(){
            sendMessageButton.isEnabled = false
            sendMessage(userToken, userEmail, chatId, messageInput)
            sendMessageButton.postDelayed({ sendMessageButton.isEnabled = true }, 2000)
        }

    }

    private fun convertIsoToLocal(isoString: String): String {
        // Parse the ISO string as an Instant (UTC)
        val instant = Instant.parse(isoString)

        // Convert to local time zone
        val localDateTime = instant.atZone(ZoneId.systemDefault())

        // Format as a readable string
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        return localDateTime.format(formatter)
    }

    private fun getMessages(token: String, email: String, chatId: String){
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        apiService.getMessages("Bearer $token", chatId).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatMessageListType = object : TypeToken<List<ChatMessage>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val chatMessageList: List<ChatMessage> = gson.fromJson(responseString, chatMessageListType)
                    for (chatMessage in chatMessageList){
                        val isMine: Boolean = chatMessage.sender_email == email
                        messages.add(Message(chatMessage.sender, chatMessage.content,
                            convertIsoToLocal(chatMessage.date), isMine ))
                        adapter.notifyItemInserted(messages.size - 1)
                        lastMessageId = chatMessage.id
                    }
                    handler.post(updateMessagesRunnable)
                } else {
                    Toast.makeText(this@ChatActivity, "Unable to Get Chats", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ChatActivity, "Unable to Update Profile", Toast.LENGTH_SHORT).show()
                Log.d(TAG,"Request failed: ${t.message}")
            }
        })
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        handler.removeCallbacks(updateMessagesRunnable)
        super.onDestroy()
    }

    override fun onPause() {
        handler.removeCallbacksAndMessages(null)
        handler.removeCallbacks(updateMessagesRunnable)
        super.onPause()
    }

    override fun onStop() {
        handler.removeCallbacksAndMessages(null)
        handler.removeCallbacks(updateMessagesRunnable)
        super.onStop()
    }

    private fun sendMessage(token: String, email: String, chatId: String, messageInput: EditText){
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val jsonObject = JSONObject()
        jsonObject.put("email", email)
        jsonObject.put("content", messageInput.text)

        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            jsonObject.toString()
        )

        val apiService = retrofit.create(ApiService::class.java)

        apiService.postMessage("Bearer $token", chatId, requestBody).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    messageInput.text.clear()
                } else {
                    Toast.makeText(this@ChatActivity, "Unable to Send Message", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ChatActivity, "Unable to Send Message", Toast.LENGTH_SHORT).show()
                Log.d(TAG,"Request failed: ${t.message}")
            }
        })

    }

    private fun updateChat(token: String, email: String, chatId: String){
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        apiService.getNewMessages("Bearer $token", chatId, lastMessageId).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatMessageListType = object : TypeToken<List<ChatMessage>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val chatMessageList: List<ChatMessage> = gson.fromJson(responseString, chatMessageListType)
                    for (chatMessage in chatMessageList){
                        val isMine: Boolean = chatMessage.sender_email == email
                        messages.add(Message(chatMessage.sender, chatMessage.content,
                            convertIsoToLocal(chatMessage.date), isMine ))
                        adapter.notifyItemInserted(messages.size - 1)
                        recyclerView.scrollToPosition(adapter.itemCount - 1)
                        lastMessageId = chatMessage.id
                    }

                } else {
                    Toast.makeText(this@ChatActivity, "Unable to Update Chat", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ChatActivity, "Unable to update Chat", Toast.LENGTH_SHORT).show()
                Log.d(TAG,"Request failed: ${t.message}")
            }
        })

    }
}

