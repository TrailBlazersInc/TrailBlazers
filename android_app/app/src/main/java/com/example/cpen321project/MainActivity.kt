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
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.example.cpen321andriodapp.ApiService
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.security.MessageDigest
import java.util.UUID

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private val activityScope = CoroutineScope(Dispatchers.Main)
    private var userToken: String? = null
    private var userEmail: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }


        findViewById<Button>(R.id.Sign_In_Button).setOnClickListener() {
            Log.d(TAG, "Sign In Button Clicked")
            Log.d(TAG, "WEB_CLIENT_ID: ${BuildConfig.WEB_CLIENT_ID}")

            val credentialManager = CredentialManager.create(this)
            val signInWithGoogleOption: GetSignInWithGoogleOption =
                GetSignInWithGoogleOption.Builder(BuildConfig.WEB_CLIENT_ID)
                    .setNonce(generateHashedNonce())
                    .build()

            val request: GetCredentialRequest = GetCredentialRequest.Builder()
                .addCredentialOption(signInWithGoogleOption)
                .build()

            activityScope.launch {
                try {
                    val result = credentialManager.getCredential(
                        request = request,
                        context = this@MainActivity,
                    )
                    handleSignIn(result)
                } catch (e: GetCredentialException) {
                    handleFailure(e)
                }
            }
        }
    }

    private fun handleFailure(e: GetCredentialException) {
        Log.e(TAG, "Error getting credential", e)
        Toast.makeText(this, "Error Getting Credential", Toast.LENGTH_SHORT).show()
    }

    private fun handleSignIn(result: GetCredentialResponse) {
        // Handle the successfully returned credential.
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        // Use googleIdTokenCredential and extract id to validate and
                        // authenticate on your server.
                        val retrofit = Retrofit.Builder()
                            .baseUrl(BuildConfig.BACKEND_URL)
                            .addConverterFactory(GsonConverterFactory.create())
                            .build()

                        val apiService = retrofit.create(ApiService::class.java)

                        val googleIdTokenCredential = GoogleIdTokenCredential
                            .createFrom(credential.data)
                        val idToken = googleIdTokenCredential.idToken
                        Log.d(TAG, "ID: $idToken")

                        val jsonObject = JSONObject()
                        jsonObject.put("googleId", idToken)

                        val requestBody = RequestBody.create(
                            MediaType.parse("application/json"),
                            jsonObject.toString()
                        )

                        val call = apiService.postUser(requestBody)

                        call.enqueue(object : retrofit2.Callback<ResponseBody> {
                            override fun onResponse(call: Call<ResponseBody>, response: retrofit2.Response<ResponseBody>) {
                                if (response.isSuccessful) {
                                    val responseString = response.body()?.string()
                                    Log.d(TAG, "Response: $responseString")
                                    if (!responseString.isNullOrEmpty()) {
                                        try {
                                            val jsonObject = JSONObject(responseString)
                                            val tkn = jsonObject.optString("token", "")
                                            val newUser = jsonObject.optBoolean("new_user", false)
                                            // Store the token for use with Recommendation activity
                                            userToken = tkn
                                            userEmail = googleIdTokenCredential.id

                                            //TO DO: IF statement for if account already exists or not to take to different page
                                            runOnUiThread {
                                                if(newUser){
                                                    val intent = Intent(this@MainActivity, ManageProfile::class.java)
                                                    intent.putExtra("tkn", tkn)
                                                    intent.putExtra("email", googleIdTokenCredential.id)
                                                    startActivity(intent)
                                                }
                                                else{
                                                    val intent = Intent(this@MainActivity, HomeActivity::class.java)
                                                    intent.putExtra("tkn", tkn)
                                                    intent.putExtra("email", googleIdTokenCredential.id)
                                                    startActivity(intent)
                                                }
                                            }
                                        } catch (e: Exception) {
                                            Log.e(TAG, "JSON Parsing error: ${e.message}")
                                        }
                                    } else {
                                        Log.e(TAG, "Response body is empty or null")
                                    }
                                } else {
                                    Log.d(TAG, "Request failed: ${response.code()}")
                                }
                            }
                            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                                Log.d(TAG,"Request failed: ${t.message}")
                            }
                        })
                        Log.d(
                            TAG,
                            "Received Google ID token: ${googleIdTokenCredential.idToken.take(10)}"
                        )
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Received an invalid google id token response", e)
                    }
                } else {
                    // Catch any unrecognized credential type here.
                    Log.e(TAG, "Unexpected type of credential")
                }
            }

            else -> {
                // Catch any unrecognized credential type here.
                Log.e(TAG, "Unexpected type of credential")
            }
        }
    }

    private fun generateHashedNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}