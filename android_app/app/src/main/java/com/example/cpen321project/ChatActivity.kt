package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.compose.material3.Text
import androidx.activity.compose.setContent
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter


class ChatActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private var messages =mutableListOf<Message>()
    private lateinit var adapter: ChatAdapter
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_chat)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        val messageInput = findViewById<EditText>(R.id.messageInput)
        val sendMessageButton = findViewById<ImageView>(R.id.sendMessageButton)
        recyclerView = findViewById(R.id.recyclerView)
        adapter = ChatAdapter(messages)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
        for (i in 0..10){
            messages.add(Message("Suo","Hello!", "10:00pm",true))
            messages.add(Message("Pablo","Hi there!", "10:00pm",  false))
        }
        messages.add(Message("Suo","hello there how are you? Hey I wanted to ask you if you would possibly like to come jog with me on Saturday evening. Please let me know AS", "9:00am", true))

        recyclerView.post {
            recyclerView.scrollToPosition(adapter.itemCount - 1)  // Scroll to bottom
        }


        findViewById<ImageView>(R.id.chevron_left).setOnClickListener(){
            intent = Intent(this, MainActivity::class.java)
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
}

