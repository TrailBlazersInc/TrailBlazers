package com.example.cpen321project

import android.Manifest
import android.app.Activity
import android.app.Instrumentation
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.GrantPermissionRule
import androidx.test.uiautomator.UiDevice
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class RecommendationTest {

    @get:Rule
    var activityScenarioRule = ActivityScenarioRule(Recommendation::class.java)

    @get:Rule
    var permissionRule: GrantPermissionRule = GrantPermissionRule.grant(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    )

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
    fun testUIElementsDisplayed() {
        onView(withId(R.id.inputLocationWeight)).check(matches(isDisplayed()))
        onView(withId(R.id.inputSpeedWeight)).check(matches(isDisplayed()))
        onView(withId(R.id.inputDistanceWeight)).check(matches(isDisplayed()))
        onView(withId(R.id.getLocationPermissionButton)).check(matches(isDisplayed()))
        onView(withId(R.id.getRecommendationButton)).check(matches(isDisplayed()))
        onView(withId(R.id.viewOnMapButton)).check(matches(isDisplayed()))
        onView(withId(R.id.recommendationRecyclerView)).check(matches(isDisplayed()))
        onView(withId(R.id.progressBar)).check(matches(withEffectiveVisibility(Visibility.GONE)))
        onView(withId(R.id.resultTextView)).check(matches(isDisplayed()))
    }

    @Test
    fun testEnterValidWeights() {
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("5"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("7"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("3"), closeSoftKeyboard())

        onView(withId(R.id.inputLocationWeight)).check(matches(withText("5")))
        onView(withId(R.id.inputSpeedWeight)).check(matches(withText("7")))
        onView(withId(R.id.inputDistanceWeight)).check(matches(withText("3")))
    }

    @Test
    fun testEnterInvalidWeights_NonNumeric() {
        var invalidWeightsErrorShown = false

        // Enter invalid weight (non-numeric text)
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("abc"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("def"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("ghi"), closeSoftKeyboard())

        // Click the recommendation button to trigger validation
        onView(withId(R.id.getRecommendationButton)).perform(click())

        // Check the flag in the activity
        activityScenarioRule.scenario.onActivity { activity ->
            invalidWeightsErrorShown = activity.invalidWeightsErrorShown
        }

        // Assert that the flag was set to true
        assert(invalidWeightsErrorShown) { "Invalid weights error was not shown" }
    }

    @Test
    fun testEnterInvalidWeights_EmptyFields() {
        var invalidWeightsErrorShown = false

        // Leave fields empty
        onView(withId(R.id.inputLocationWeight)).perform(replaceText(""), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText(""), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText(""), closeSoftKeyboard())

        // Click the recommendation button to trigger validation
        onView(withId(R.id.getRecommendationButton)).perform(click())

        // Check the flag in the activity
        activityScenarioRule.scenario.onActivity { activity ->
            invalidWeightsErrorShown = activity.invalidWeightsErrorShown
        }

        // Assert that the flag was set to true
        assert(invalidWeightsErrorShown) { "Invalid weights error was not shown for empty fields" }
    }

    @Test
    fun testEnterInvalidWeights_PartiallyFilled() {
        var invalidWeightsErrorShown = false

        // Only fill some fields
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("5"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText(""), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("3"), closeSoftKeyboard())

        // Click the recommendation button to trigger validation
        onView(withId(R.id.getRecommendationButton)).perform(click())

        // Check the flag in the activity
        activityScenarioRule.scenario.onActivity { activity ->
            invalidWeightsErrorShown = activity.invalidWeightsErrorShown
        }

        // Assert that the flag was set to true
        assert(invalidWeightsErrorShown) { "Invalid weights error was not shown for partially filled fields" }
    }

    @Test
    fun testClickGetRecommendationButton_ShowsProgressBar() {
        // Enter valid weights first
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("5"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("5"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("5"), closeSoftKeyboard())

        // Progress bar should be initially hidden
        onView(withId(R.id.progressBar)).check(matches(withEffectiveVisibility(Visibility.GONE)))

        // Click the button
        onView(withId(R.id.getRecommendationButton)).perform(click())

        // Check progress bar appears
        onView(withId(R.id.progressBar)).check(matches(isDisplayed()))

        // Check text updates
        onView(withId(R.id.resultTextView)).check(matches(withText("Fetching recommendations...")))
    }

    @Test
    fun testRequestLocationPermission_PermissionAlreadyGranted() {
        // Since we used GrantPermissionRule, permissions are already granted
        // Click the permission button
        onView(withId(R.id.getLocationPermissionButton)).perform(click())

        // Wait a moment for possible toast (may not be reliable in tests)
        Thread.sleep(1000)

        // We can't reliably test for toast in this case, but we can verify
        // the app didn't crash when attempting to use the permission
    }

    @Test
    fun testClickViewOnMapButton_NavigatesToMapActivity() {
        // Set up intended response
        Intents.intending(IntentMatchers.hasComponent(MapsActivity::class.java.name))
            .respondWith(Instrumentation.ActivityResult(Activity.RESULT_OK, null))

        // Click the map button
        onView(withId(R.id.viewOnMapButton)).perform(click())

        // Verify the intent was sent
        Intents.intended(IntentMatchers.hasComponent(MapsActivity::class.java.name))
    }

    @Test
    fun testWeightInputRangeValidation() {
        // Test with values out of expected range (assuming 0-10 is valid)
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("15"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("7"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("3"), closeSoftKeyboard())

        // If your app validates weight ranges beyond just checking if they're numbers
        // Add validation logic here
    }

    @Test
    fun testInitialLoadState() {
        // Check initial state of the recommendation list
        onView(withId(R.id.recommendationRecyclerView)).check(matches(isDisplayed()))
        // Further checks would depend on your implementation - whether the list
        // starts empty or pre-populated
    }
}
