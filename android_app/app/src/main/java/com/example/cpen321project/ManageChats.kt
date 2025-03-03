package com.example.cpen321project

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321andriodapp.ApiService
import com.example.cpen321project.ManageProfile.Companion
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

data class Chat(
    val id: String,
    val title: String,
    val members: Int
)

class ManageChats : AppCompatActivity() {
    companion object{
         private const val TAG = "ManageChats"
    }
    private lateinit var recyclerView: RecyclerView
    private var groups =mutableListOf<ChatOverview>()
    private lateinit var adapter: ChatOverviewAdapter
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_manage_chats)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        val userToken = intent.extras?.getString("tkn") ?: ""
        val userEmail = intent.extras?.getString("email") ?: ""
        recyclerView = findViewById(R.id.recyclerView)
        groups.add(ChatOverview("","Community Group", 5))
        groups.add(ChatOverview("","Alfredo Alexei", 2))
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = ChatOverviewAdapter(groups, this)
        recyclerView.adapter = adapter
        getChats(userToken, userEmail)


    }

    private fun getChats(token: String, email: String){
        val retrofit = Retrofit.Builder()
            .baseUrl("http://10.0.2.2:3000/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        apiService.getChats("Bearer $token", email).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    val gson = Gson()
                    val chatListType = object : TypeToken<List<Chat>>() {}.type
                    val responseString = response.body()?.string() ?: return
                    val chatList: List<Chat> = gson.fromJson(responseString, chatListType)
                    for (chat in chatList){
                        groups.add(ChatOverview(chat.id, chat.title, chat.members))
                        adapter.notifyItemInserted(groups.size - 1)
                    }

                } else {
                    Toast.makeText(this@ManageChats, "Unable to Get Chats", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Toast.makeText(this@ManageChats, "Unable to Update Profile", Toast.LENGTH_SHORT).show()
                Log.d(ManageChats.TAG,"Request failed: ${t.message}")
            }
        })
    }
}