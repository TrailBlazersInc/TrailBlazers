package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_home)

        val extras = intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        findViewById<Button>(R.id.manageProfileButton).setOnClickListener() {
            val intent = Intent(this, ManageProfile::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }
        findViewById<Button>(R.id.recommendationButton).setOnClickListener {
            val intent = Intent(this, Recommendation::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }

        findViewById<Button>(R.id.groups_button).setOnClickListener() {
            val intent = Intent(this, ManageChats::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }
        findViewById<Button>(R.id.signOutButton).setOnClickListener() {
            lifecycleScope.launch {
                val credentialManager = CredentialManager.create(this@HomeActivity)
                credentialManager.clearCredentialState(ClearCredentialStateRequest())

                clearUserSession()
                val intent = Intent(this@HomeActivity, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK // Clears activity stack
                startActivity(intent)
                finish()
            }
        }
    }
    private fun clearUserSession() {
        val sharedPreferences = getSharedPreferences("UserSession", MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.clear()
        editor.apply()
    }
}
