import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321project.R
import com.example.cpen321project.RecommendationItem

class RecommendationAdapter(private val recommendations: List<RecommendationItem>) :
    RecyclerView.Adapter<RecommendationAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val rankText: TextView = view.findViewById(R.id.rankText)
        val scoreText: TextView = view.findViewById(R.id.scoreText)
        val nameText: TextView = view.findViewById(R.id.nameText)
        val paceText: TextView = view.findViewById(R.id.paceText)
        val distanceText: TextView = view.findViewById(R.id.distanceText)
        val timeText: TextView = view.findViewById(R.id.timeText)
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
        holder.scoreText.text = "Matching score: ${recommendation.score}"
        holder.paceText.text = "Pace: ${recommendation.pace}"
        holder.distanceText.text = "Distance: ${recommendation.distance}"
        holder.timeText.text = "Time: ${recommendation.time}"
    }

    override fun getItemCount(): Int {
        return recommendations.size
    }
}
