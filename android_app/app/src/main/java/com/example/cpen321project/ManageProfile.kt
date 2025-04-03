package com.example.cpen321project

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.lifecycle.lifecycleScope
import com.example.cpen321andriodapp.UserService
import com.example.cpen321project.MainActivity.Companion
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
import org.json.JSONException
import org.json.JSONObject
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class ManageProfile : AppCompatActivity() {

    companion object {
        private const val TAG = "ManageProfile"
    }

    private lateinit var paceText: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_manage_profile)
        paceText = findViewById(R.id.editTextNumberDecimal)
        paceText.setText("1");
        val runDistanceArray = resources.getStringArray(R.array.RunDistance)
        val runTimeArray = resources.getStringArray(R.array.RunTime)
        var runDistance: String? = null
        var runTime: String? = null
        val extras = intent.extras
        val tkn = extras?.getString("tkn") ?: ""
        val email = extras?.getString("email") ?: ""
        val monday = findViewById<Switch>(R.id.monday_switch)
        val tuesday = findViewById<Switch>(R.id.tuesday_switch)
        val wednesday = findViewById<Switch>(R.id.wednesday_switch)
        val thursday = findViewById<Switch>(R.id.thursday_switch)
        val friday = findViewById<Switch>(R.id.friday_switch)
        val saturday = findViewById<Switch>(R.id.saturday_switch)
        val sunday = findViewById<Switch>(R.id.sunday_switch)

        setupSpinner(findViewById(R.id.RunDistance), runDistanceArray) { selectedDistance ->
            runDistance = selectedDistance
        }
        setupSpinner(findViewById(R.id.RunTime), runTimeArray) { selectedTime ->
            runTime = selectedTime
        }
        fetchUserData(tkn, email)

        findViewById<Button>(R.id.save_button).setOnClickListener() {
            val pace = paceText.text.toString().toFloatOrNull()
            if(pace == null || pace.toDouble() == 0.0 || pace.toDouble() >= 21.02){
                Snackbar.make(findViewById(R.id.main), "Please enter valid Pace value", Snackbar.LENGTH_SHORT).show()
            }
            else{
                val availabilityJson = """{"monday": ${monday.isChecked},"tuesday": ${tuesday.isChecked},"wednesday": ${wednesday.isChecked},"thursday": ${thursday.isChecked},"friday": ${friday.isChecked},"saturday": ${saturday.isChecked},"sunday": ${sunday.isChecked}}""".trimIndent()

                val jsonString = """{"distance": "${runDistance ?: "0"}","time": "${runTime ?: "0"}","pace": $pace,"availability": $availabilityJson}"""
                val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonString)
                updateUser(tkn, email, requestBody)
            }
        }
        findViewById<Button>(R.id.signOutButton).setOnClickListener() {
            signOutHelper()
        }
        findViewById<Button>(R.id.home_button).setOnClickListener() {
            val intent = Intent(this, HomeActivity::class.java)
            intent.putExtra("tkn", tkn)
            intent.putExtra("email", email)
            startActivity(intent)
        }
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
    }
    
    private fun signOutHelper(){
        lifecycleScope.launch {
            val credentialManager = CredentialManager.create(this@ManageProfile)
            credentialManager.clearCredentialState(ClearCredentialStateRequest())

            clearUserSession()
            val intent = Intent(this@ManageProfile, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK // Clears activity stack
            startActivity(intent)
            finish()
        }
    }

    private fun updateUser(token: String, email: String, requestBody: RequestBody){

        val apiService = RetrofitClient.getClient(this).create(UserService::class.java)

        apiService.updateUser("Bearer $token", email, requestBody).enqueue(object : Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    Snackbar.make(findViewById(R.id.main), "Changes Saved", Snackbar.LENGTH_SHORT).show()
                } else {
                    Snackbar.make(findViewById(R.id.main), "Unable to Update Profile", Snackbar.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Snackbar.make(findViewById(R.id.main), "Unable to Update Profile", Snackbar.LENGTH_SHORT).show()
                Log.d(TAG,"Request failed: ${t.message}")
            }
        })
    }
    private fun setupSpinner(spinner: Spinner, items: Array<String>, onItemSelected: (String) -> Unit) {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, items)
        spinner.adapter = adapter
        spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                onItemSelected(items[position])
            }

            override fun onNothingSelected(parent: AdapterView<*>) {
                // Do nothing
            }
        }
    }

    private fun fetchUserData(token: String, email: String) {
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.BACKEND_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val apiService = retrofit.create(UserService::class.java)

        apiService.getUser("Bearer $token", email).enqueue(object : Callback<ResponseBody> {
            override fun onResponse(call: Call<ResponseBody>, response: Response<ResponseBody>) {
                if (response.isSuccessful) {
                    response.body()?.string()?.let { responseBody ->
                        try {
                            val jsonObject = JSONObject(responseBody)
                            val user = jsonObject.getJSONObject("user")

                            val distance = user.getString("distance")
                            val time = user.getString("time")
                            val pace = user.getDouble("pace")
                            val availability = user.getJSONObject("availability")

                            runOnUiThread {
                                updateUI(distance, time, pace, availability)
                            }
                        } catch (e: JSONException) {
                            Log.e(TAG, "JSON parsing error: ${e.message}")
                        }
                    }
                } else {
                    Snackbar.make(findViewById(R.id.main), "Failed to load user data", Snackbar.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
                Snackbar.make(findViewById(R.id.main), "Unable to fetch user data", Snackbar.LENGTH_SHORT).show()
                Log.d(TAG, "Request failed: ${t.message}")
            }
        })
    }

    private fun updateUI(distance: String, time: String, pace: Double, availability: JSONObject) {
        val runDistanceSpinner = findViewById<Spinner>(R.id.RunDistance)
        val runTimeSpinner = findViewById<Spinner>(R.id.RunTime)

        runDistanceSpinner.setSelection(resources.getStringArray(R.array.RunDistance).indexOf(distance))
        runTimeSpinner.setSelection(resources.getStringArray(R.array.RunTime).indexOf(time))

        paceText.setText(pace.toString())

        findViewById<Switch>(R.id.monday_switch).isChecked = availability.getBoolean("monday")
        findViewById<Switch>(R.id.tuesday_switch).isChecked = availability.getBoolean("tuesday")
        findViewById<Switch>(R.id.wednesday_switch).isChecked = availability.getBoolean("wednesday")
        findViewById<Switch>(R.id.thursday_switch).isChecked = availability.getBoolean("thursday")
        findViewById<Switch>(R.id.friday_switch).isChecked = availability.getBoolean("friday")
        findViewById<Switch>(R.id.saturday_switch).isChecked = availability.getBoolean("saturday")
        findViewById<Switch>(R.id.sunday_switch).isChecked = availability.getBoolean("sunday")
    }

    private fun clearUserSession() {
        val sharedPreferences = getSharedPreferences("UserSession", MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.clear()
        editor.apply()
    }
}