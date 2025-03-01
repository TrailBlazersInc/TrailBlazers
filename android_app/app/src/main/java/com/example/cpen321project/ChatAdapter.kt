package com.example.cpen321project

import android.graphics.Color
import android.graphics.Typeface
import android.text.SpannableString
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RelativeLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView

var MAX_TEXT_MESSAGE_WITH = 0.8
class ChatAdapter (private val messages: List<Message>) :
    RecyclerView.Adapter<ChatAdapter.ViewHolder>(){

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val messageText: TextView

            init {
                // Define click listener for the ViewHolder's View
                messageText = view.findViewById(R.id.messageText)
            }
        }

        override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder{
            val view = LayoutInflater.from(viewGroup.context)
                .inflate(R.layout.message_item, viewGroup, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val layoutParams = holder.messageText.layoutParams as RelativeLayout.LayoutParams
            layoutParams.removeRule(RelativeLayout.ALIGN_PARENT_LEFT)
            layoutParams.removeRule(RelativeLayout.ALIGN_PARENT_RIGHT)
            var username = messages[position].username
            holder.messageText.setBackgroundResource(R.drawable.message_bg)
            if (messages[position].isMine){
                username = "Me"
                layoutParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT)
                holder.messageText.setBackgroundResource(R.drawable.my_message_bg)

            } else{
                layoutParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT)
            }
            val context = holder.messageText.context
            val maxWidthPx = (context.resources.displayMetrics.widthPixels * MAX_TEXT_MESSAGE_WITH).toInt()
            holder.messageText.maxWidth = maxWidthPx

            holder.messageText.text = formatMessage(username + "\n", messages[position].text + "\n", messages[position].date)
            holder.messageText.layoutParams = layoutParams
        }

        override fun getItemCount() = messages.size

        private fun formatMessage(username: String, content: String, messageDate: String) : SpannableStringBuilder{
            val spannable = SpannableStringBuilder()

            // Username (bold and bigger)
            val usernameSpan = SpannableString(username)
            usernameSpan.setSpan(StyleSpan(Typeface.BOLD), 0, username.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            usernameSpan.setSpan(RelativeSizeSpan(1.2f), 0, username.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.append(usernameSpan)

            val messageTextSpan = SpannableString(content)
            messageTextSpan.setSpan(ForegroundColorSpan(Color.BLACK), 0, content.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.append(messageTextSpan)

            // Date (smaller and gray)
            val messageDateSpan = SpannableString(messageDate)
            messageDateSpan.setSpan(ForegroundColorSpan(Color.GRAY), 0, messageDate.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            messageDateSpan.setSpan(RelativeSizeSpan(0.8f), 0, messageDate.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.append(messageDateSpan)

            return spannable
        }

    }
