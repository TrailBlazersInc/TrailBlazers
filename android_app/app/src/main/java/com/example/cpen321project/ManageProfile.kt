package com.example.cpen321project

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class ManageProfile : AppCompatActivity() {

    companion object {
        private const val TAG = "ManageProfile"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_manage_profile)


        val runDistanceArray = resources.getStringArray(R.array.RunDistance)
        val runTimeArray = resources.getStringArray(R.array.RunTime)
        var runDistance: String? = null
        var runTime: String? = null

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
                    // GET Old value
                }
            }
        }
        val timeSpinner = findViewById<Spinner>(R.id.RunTime)
        if (timeSpinner != null) {
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
                    // GET Old value
                }
            }
        }

        findViewById<Button>(R.id.save_button).setOnClickListener() {
            //PUT Stuff
        }

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
    }
}