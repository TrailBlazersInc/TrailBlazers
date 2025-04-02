package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import androidx.fragment.app.Fragment

class HeaderFragment: Fragment(R.layout.header) {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val profile = view.findViewById<ImageView>(R.id.profile)
        val logo = view.findViewById<ImageView>(R.id.ivLogo)
        val extras = requireActivity().intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""

        profile.setOnClickListener {
            val intent = Intent(requireContext(), ManageProfile::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }

        logo.setOnClickListener {
            val intent = Intent(requireContext(), HomeActivity::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }
    }
}