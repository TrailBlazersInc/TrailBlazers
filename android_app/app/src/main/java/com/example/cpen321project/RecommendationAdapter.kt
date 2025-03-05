import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.core.content.ContextCompat.startActivity
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321andriodapp.ApiService
import com.example.cpen321project.BuildConfig
import com.example.cpen321project.Chat
import com.example.cpen321project.ChatActivity
import com.example.cpen321project.R
import com.example.cpen321project.RecommendationItem
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

class RecommendationAdapter(private val recommendations: List<RecommendationItem>, private val token: String,
                            private val email: String, private val context: Context) :
    RecyclerView.Adapter<RecommendationAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val messageButton: Button = view.findViewById(R.id.addUserButton)
        val rankText: TextView = view.findViewById(R.id.rankText)
        val scoreText: TextView = view.findViewById(R.id.scoreText)
        val nameText: TextView = view.findViewById(R.id.nameText)
        val paceText: TextView = view.findViewById(R.id.paceText)
        val distanceText: TextView = view.findViewById(R.id.distanceText)
        val timeText: TextView = view.findViewById(R.id.timeText)
        val availabilityText: TextView = view.findViewById(R.id.availabilityText)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_recommendation, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val recommendation = recommendations[position]
        holder.rankText.text = "#${recommendation.rank}"
        holder.nameText.text = recommendation.name
        holder.scoreText.text = "Matching score: ${String.format("%.2f", recommendation.score)}"
        holder.paceText.text = "Pace: ${recommendation.pace}"
        holder.distanceText.text = "Distance: ${recommendation.distance}"
        holder.timeText.text = "Time: ${recommendation.time}"

        // Format availability
        val availabilityText = buildString {
            append("Available days: ")
            val days = listOf(
                "Mon" to recommendation.availability.monday,
                "Tue" to recommendation.availability.tuesday,
                "Wed" to recommendation.availability.wednesday,
                "Thu" to recommendation.availability.thursday,
                "Fri" to recommendation.availability.friday,
                "Sat" to recommendation.availability.saturday,
                "Sun" to recommendation.availability.sunday
            )
            append(days.filter { it.second }.map { it.first }.joinToString(", "))
        }
        holder.availabilityText.text = availabilityText

        holder.messageButton.setOnClickListener(){
            directMessage(recommendations[position].email)
        }
    }

    private fun directMessage(message_email: String){
        createChat(message_email)
    }

    private fun createChat(message_email: String) {
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(ApiService::class.java)

        val jsonObject = JSONObject()
        jsonObject.put("target_email", message_email)

        val requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            jsonObject.toString()
        )

        apiService.postDMChat("Bearer $token", email, requestBody).enqueue(object :
            Callback<ResponseBody> {
            override fun onResponse(
                call: Call<ResponseBody>,
                response: Response<ResponseBody>
            ) {
                if (response.isSuccessful) {
                    try {
                        val gson = Gson()
                        val chatType = object : TypeToken<Chat>() {}.type
                        val responseString = response.body()?.string() ?: return
                        val chat: Chat = gson.fromJson(responseString, chatType)
                        val intent = Intent(context, ChatActivity::class.java)
                        intent.putExtra("tkn", token)
                        intent.putExtra("email", email)
                        intent.putExtra("chatName", chat.title)
                        intent.putExtra("chatId", chat.id)
                        context.startActivity(intent)
                    } catch(error: Exception){
                        Log.d("CreateDM", error.toString())
                    }
                } else {
                    Log.d("CreateDM", "$response")
                }
            }
            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Log.d("CreateDM","Request failed: ${t.message}")
            }
        })
    }

    override fun getItemCount(): Int {
        return recommendations.size
    }
}