package com.example.cpen321project

import android.util.Log
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.clearText
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.hamcrest.CoreMatchers.containsString
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.random.Random

private const val TAG = "Testing"

@RunWith(AndroidJUnit4::class)
class ManageProfileTest {

    @get:Rule
    var activityScenarioRule = ActivityScenarioRule(MainActivity::class.java)

    private lateinit var device: UiDevice

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        // Initialize Intents for testing navigation
        Intents.init()
    }

    @After
    fun tearDown() {
        // Release Intents
        Intents.release()
    }

    @Test
    fun updatePreferencesTest() {
        Log.d(TAG, "Testing Manage Profile")

        onView(withId(R.id.Sign_In_Button)).perform(click())
        Thread.sleep(1000)
        val accountSelector = device.findObject(UiSelector().textContains("hellothisworld2000@gmail.com")) // Replace with part of email
        if (accountSelector.exists()) {
            accountSelector.click()
        } else {
            throw Exception("No Google account found for sign-in")
        }

        // Wait for HomeActivity to load
        Thread.sleep(5000)
        // Click "Manage Profile" Button in HomeActivity
        onView(withId(R.id.manageProfileButton)).perform(click())

        onView(withId(R.id.editTextNumberDecimal))
            .perform(clearText(), typeText("25.0"))
        Thread.sleep(1000)

        onView(withId(R.id.editTextNumberDecimal)).check(matches(withText("25.0")))

        onView(withId(R.id.save_button)).perform(click())

        //Check text
        onView(withText("Please enter valid Pace value"))
            .check(matches(isDisplayed()))

        val randomDecimal = String.format("%.1f", Random.nextDouble(1.0, 20.0))

        onView(withId(R.id.editTextNumberDecimal))
            .perform(clearText(), typeText(randomDecimal))
        Thread.sleep(1000)

        onView(withId(R.id.editTextNumberDecimal)).check(matches(withText(randomDecimal)))

        // Click Save Button
        onView(withId(R.id.save_button)).perform(click())

        onView(withText(containsString("Changes Saved")))
            .check(matches(isDisplayed()))
        Thread.sleep(1000)

        Log.d(TAG, "Test 1: Successfully updated profile")
    }
}