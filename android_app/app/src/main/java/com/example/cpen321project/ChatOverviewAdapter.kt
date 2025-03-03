package com.example.cpen321project

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat.startActivity
import androidx.recyclerview.widget.RecyclerView
import com.example.cpen321project.ChatAdapter.ViewHolder

class ChatOverviewAdapter (private val groups: List<ChatOverview>, private val token: String,
                           private val email: String, private val context: Context) :
    RecyclerView.Adapter<ChatOverviewAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val groupName: TextView
        val box: LinearLayout

        init {
            groupName = view.findViewById(R.id.groupName)
            box = view.findViewById(R.id.box)
        }
    }

    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(viewGroup.context)
            .inflate(R.layout.chat_group_item, viewGroup, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val members: Int = groups[position].members
        if (members > 2) {
            holder.groupName.text = formatMessage(groups[position].title + "\n", "$members members")
        } else {
            holder.groupName.text = formatMessage(groups[position].title + "\n", "DM")
        }
        holder.box.setOnClickListener{
            val intent = Intent(context, ChatActivity::class.java)
            intent.putExtra("tkn", token)
            intent.putExtra("email", email)
            intent.putExtra("chatName", groups[position].title)
            intent.putExtra("chatId", groups[position].id)
            context.startActivity(intent)
        }
    }

    override fun getItemCount() = groups.size

    private fun formatMessage(groupName: String, members: String) : SpannableStringBuilder {
        val spannable = SpannableStringBuilder()

        // Group Name (bold and bigger)
        val groupNameSpan = SpannableString(groupName)
        groupNameSpan.setSpan(StyleSpan(Typeface.BOLD), 0, groupName.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        groupNameSpan.setSpan(ForegroundColorSpan(Color.DKGRAY), 0, groupName.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        groupNameSpan.setSpan(RelativeSizeSpan(1.5f), 0, groupName.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.append(groupNameSpan)

        val membersSpan = SpannableString(members)
        membersSpan.setSpan(ForegroundColorSpan(Color.DKGRAY), 0, members.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        membersSpan.setSpan(RelativeSizeSpan(1.2f), 0, members.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        spannable.append(membersSpan)

        return spannable
    }
}