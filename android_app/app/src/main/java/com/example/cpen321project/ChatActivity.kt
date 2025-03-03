package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
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
class ChatActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private var messages =mutableListOf<Message>()
    private lateinit var adapter: ChatAdapter
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
        val userToken = intent.extras?.getString("tkn") ?: ""
        val userEmail = intent.extras?.getString("email") ?: ""
        val chatId = intent.extras?.getString("chatId")?: ""
        val chatName = intent.extras?.getString("chatName")?: ""
        val messageInput = findViewById<EditText>(R.id.messageInput)
        val sendMessageButton = findViewById<ImageView>(R.id.sendMessageButton)
        val chatNameTextView = findViewById<TextView>(R.id.manage_chats_title)
        chatNameTextView.text = chatName
        recyclerView = findViewById(R.id.recyclerView)
        adapter = ChatAdapter(messages)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
        getMessages(userToken, userEmail, chatId)


        findViewById<ImageView>(R.id.chevron_left).setOnClickListener(){
            intent = Intent(this, MainActivity::class.java)
            intent.putExtra("tkn", userToken)
            intent.putExtra("email", userEmail)
            startActivity(intent)
        }


        fun getToday(): String{
            val formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm")
            val currentDateTime = LocalDateTime.now().format(formatter)
            return currentDateTime
        }

        fun sendMessage(){
            val message = messageInput.text.toString().trim()
            messages.add(Message("Me", message, getToday(), true ))
            adapter.notifyItemInserted(messages.size - 1)
            recyclerView.scrollToPosition(adapter.itemCount - 1)
            messageInput.text.clear()
        }

        sendMessageButton.setOnClickListener(){
            sendMessage()
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
            .baseUrl("http://10.0.2.2:3000/")
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
}

