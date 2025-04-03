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
import io.socket.client.IO;
import io.socket.client.Socket
import io.socket.emitter.Emitter;
import org.json.JSONArray
import org.json.JSONException


data class ChatMessage (
    val id: String,
    val sender_email: String,
    val sender: String,
    val content: String,
    val date: String
)

class ChatActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private var messages =mutableListOf<Message>()
    private lateinit var adapter: ChatAdapter
    private val handler = Handler(Looper.getMainLooper())
    private var lastMessageId = ""
    private lateinit var userToken: String
    private lateinit var userEmail: String
    private lateinit var chatId: String
    private val socket = ChatSocket.socket

    private companion object {
        private const val TAG = "ChatActivity"
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
        val reportButton : ImageView = findViewById(R.id.reportButton)

        socket?.on("join_chat", onJoinChat)
        socket?.on("req-error", onReqError)
        socket?.on("message", onNewMessage)

        socket?.on(Socket.EVENT_DISCONNECT, Emitter.Listener {
            println("Disconnected from server")
        })

        socket?.on(Socket.EVENT_CONNECT) {
            val json = JSONObject()
            json.put("chatId", chatId)
            socket.emit("join_chat", json.toString())
        }

        socket?.connect()

        chatNameTextView.text = chatName
        recyclerView = findViewById(R.id.recyclerView)
        adapter = ChatAdapter(messages)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter

        reportButton.setOnClickListener(){
            intent = Intent(this, ReportUserActivity::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("chatId", chatId)
            intent.putExtra("email", userEmail)
            intent.putExtra("chatName", chatName )
            startActivity(intent)
        }


        findViewById<ImageView>(R.id.chevron_left).setOnClickListener(){
            intent = Intent(this, ManageChats::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("email", userEmail)
            startActivity(intent)
        }

        sendMessageButton.setOnClickListener(){
            sendMessageButton.isEnabled = false
            sendMessage(messageInput)
            sendMessageButton.postDelayed({ sendMessageButton.isEnabled = true }, 5000)
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

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

        apiService.getMessages("Bearer $token", chatId).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatMessageListType = object : TypeToken<List<ChatMessage>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val chatMessageList: List<ChatMessage> = gson.fromJson(responseString, chatMessageListType)
                    for (chatMessage in chatMessageList) {
                        val isMine: Boolean = chatMessage.sender_email == email
                        messages.add(
                            Message(
                                chatMessage.sender, chatMessage.content,
                                convertIsoToLocal(chatMessage.date), isMine
                            )
                        )
                        adapter.notifyItemInserted(messages.size - 1)
                        lastMessageId = chatMessage.id
                    }
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
        super.onDestroy()
        socket?.disconnect()
    }

    override fun onPause() {
        handler.removeCallbacksAndMessages(null)
        super.onPause()
        socket?.disconnect()
    }

    override fun onStop() {
        handler.removeCallbacksAndMessages(null)
        super.onStop()
        socket?.disconnect()
    }

    private fun sendMessage(content: EditText){
        val json = JSONObject()
        json.put("chatId", chatId)
        json.put("email", userEmail)
        json.put("content", content.text)

        socket?.emit("message", json.toString())
        content.text.clear()
    }

    private val onNewMessage = Emitter.Listener { args ->
        runOnUiThread {
            val gson = Gson()
            val data: JSONObject = args[0] as? JSONObject ?: return@runOnUiThread

            try {
                val message: ChatMessage = gson.fromJson(data.toString(), ChatMessage::class.java)
                val isMine: Boolean = message.sender_email == userEmail
                messages.add(Message(message.sender, message.content,
                    convertIsoToLocal(message.date), isMine ))
                adapter.notifyItemInserted(messages.size - 1)
                recyclerView.scrollToPosition(adapter.itemCount - 1)
            } catch (e: JSONException) {
                return@runOnUiThread
            }
        }
    }

    private val onJoinChat = Emitter.Listener { args ->
        runOnUiThread {
            Log.d(TAG, "Joined Chat")
            Log.d(TAG, args[0].toString())
            val gson = Gson()
            val chatMessageListType = object : TypeToken<List<ChatMessage>>() {}.type
            val data: JSONArray = args[0] as? JSONArray ?: return@runOnUiThread
            try {
                val size = messages.size
                messages.clear()
                adapter.notifyItemRangeRemoved(0, size)
                val messageList: List<ChatMessage> = gson.fromJson(data.toString(), chatMessageListType)
                for (chatMessage in  messageList){
                    val isMine: Boolean = chatMessage.sender_email == userEmail
                    messages.add(Message(chatMessage.sender, chatMessage.content,
                        convertIsoToLocal(chatMessage.date), isMine ))
                    adapter.notifyItemInserted(messages.size - 1)
                    recyclerView.scrollToPosition(adapter.itemCount - 1)
                }
            } catch (e: JSONException) {
                return@runOnUiThread
            }
        }
    }

    private val onReqError = Emitter.Listener { args ->
        runOnUiThread {
            val data: String = args[0] as? String ?: return@runOnUiThread
            Log.e(TAG, data)
        }
    }
}

