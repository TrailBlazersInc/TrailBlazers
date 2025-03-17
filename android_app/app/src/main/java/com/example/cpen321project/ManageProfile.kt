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
import com.example.cpen321andriodapp.ApiService
import com.example.cpen321project.MainActivity.Companion
import com.google.android.material.snackbar.Snackbar
import okhttp3.MediaType
import okhttp3.RequestBody
import okhttp3.ResponseBody
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
        Log.d(TAG, "tkn and email: $tkn and $email")
        val monday = findViewById<Switch>(R.id.monday_switch)
        val tuesday = findViewById<Switch>(R.id.tuesday_switch)
        val wednesday = findViewById<Switch>(R.id.wednesday_switch)
        val thursday = findViewById<Switch>(R.id.thursday_switch)
        val friday = findViewById<Switch>(R.id.friday_switch)
        val saturday = findViewById<Switch>(R.id.saturday_switch)
        val sunday = findViewById<Switch>(R.id.sunday_switch)

        val disSpinner = findViewById<Spinner>(R.id.RunDistance)
        if (disSpinner != null) {
            val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, runDistanceArray)
            disSpinner.adapter = adapter

            disSpinner.onItemSelectedListener = object :
                AdapterView.OnItemSelectedListener {
                override fun onItemSelected(
                    parent: AdapterView<*>,
                    view: View, position: Int, id: Long
                ) {
                    Log.d(TAG, runDistanceArray[position])
                    runDistance = runDistanceArray[position]
                }
                override fun onNothingSelected(parent: AdapterView<*>) {
                    // Do Nothing
                }
            }
        }
        val timeSpinner = findViewById<Spinner>(R.id.RunTime)
        if (timeSpinner != null) {
            //Note: Will be better to make helper function to reduce repetition
            val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, runTimeArray)
            timeSpinner.adapter = adapter

            timeSpinner.onItemSelectedListener = object :
                AdapterView.OnItemSelectedListener {
                override fun onItemSelected(
                    parent: AdapterView<*>,
                    view: View, position: Int, id: Long
                ) {
                    Log.d(TAG, runTimeArray[position])
                    runTime = runTimeArray[position]
                }

                override fun onNothingSelected(parent: AdapterView<*>) {
                    // Do Nothing
                }
            }
        }

        findViewById<Button>(R.id.save_button).setOnClickListener() {
            val pace = paceText.text.toString().toFloatOrNull()
            if(pace == null || pace.toDouble() == 0.0 || pace.toDouble() >= 21.02){
                Snackbar.make(findViewById(R.id.main), "Please enter valid Pace value", Snackbar.LENGTH_SHORT).show()
            }
            else{
                val availabilityJson = """
                {
                    "monday": ${monday.isChecked},
                    "tuesday": ${tuesday.isChecked},
                    "wednesday": ${wednesday.isChecked},
                    "thursday": ${thursday.isChecked},
                    "friday": ${friday.isChecked},
                    "saturday": ${saturday.isChecked},
                    "sunday": ${sunday.isChecked}
                }
                """.trimIndent()

                val jsonString = """
                    {
                        "distance": "${runDistance ?: "0"}",
                        "time": "${runTime ?: "0"}",
                        "pace": $pace,
                        "availability": $availabilityJson
                    }
                """
                val requestBody = RequestBody.create(
                    MediaType.parse("application/json"), jsonString
                )
                updateUser(tkn, email, requestBody)
            }
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
    private fun updateUser(token: String, email: String, requestBody: RequestBody){

        val apiService = RetrofitClient.getClient(this).create(ApiService::class.java)

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
}