import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.util.Log
import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.Espresso.pressBack
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.contrib.RecyclerViewActions
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObjectNotFoundException
import androidx.test.uiautomator.UiSelector
import com.example.cpen321project.*
import junit.framework.TestCase.assertTrue
import org.hamcrest.Matchers.allOf
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

private const val LAG: Long = 8000
private const val TAG = "RecommendationE2ETest"

@RunWith(AndroidJUnit4::class)
class RecommendationTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Before
    fun setUp() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test
    fun testGetRecommendation() {
        onView(withId(R.id.Sign_In_Button))
            .check(matches(isDisplayed()))
            .perform(click())
        Thread.sleep(3000)
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        var accountSelector = device.findObject(UiSelector().textContains("yuqianyi1409@gmail.com")) // Replace with part of email
        if (accountSelector.exists()) {
            accountSelector.click() // Click the first available Google account
        } else {
            throw NoSuchElementException("No Google account found for sign-in")
        }

        // Wait for HomeActivity to load
        Thread.sleep(5000) // Adjust as needed, or use IdlingResource

        // 1. Click "Recommendation" Button in HomeActivity
        onView(withId(R.id.recommendationButton))
            .check(matches(isDisplayed()))
            .perform(click())

        // Ensure Recommendation Screen is loaded
        Intents.intended(hasComponent(Recommendation::class.java.name))

        // 2a. When input field is invalid (non numeric)
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("abc"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("def"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("ghi"), closeSoftKeyboard())
        onView(withId(R.id.inputAvailabilityWeight)).perform(replaceText("hjk"), closeSoftKeyboard())

        onView(withId(R.id.getRecommendationButton)).perform(click())
        onView(withText("Please enter valid weights (0-10)")).check(matches(isDisplayed()))

        // 2. Correct input
        onView(withId(R.id.inputLocationWeight)).perform(replaceText("5"), closeSoftKeyboard())
        onView(withId(R.id.inputSpeedWeight)).perform(replaceText("6"), closeSoftKeyboard())
        onView(withId(R.id.inputDistanceWeight)).perform(replaceText("7"), closeSoftKeyboard())
        onView(withId(R.id.inputAvailabilityWeight)).perform(replaceText("8"), closeSoftKeyboard())


        // 3. Grant location permission
        accountSelector = device.findObject(UiSelector().textContains("Only this time")) // Grant location permission for this time
        if (accountSelector.exists()) {
            accountSelector.click() // Click the first available Google account
            Log.d(TAG, "Permission granted")
        }

        val t1  = System.currentTimeMillis()

        // 4. Get recommendation
        onView(withId(R.id.getRecommendationButton)).perform(click())

        // 5. Most recommended jogger is well displayed
        onView(withId(R.id.recommendationRecyclerView)).check(matches(isDisplayed()))
        val t2  = System.currentTimeMillis()
        assertTrue("Schedule upload took more than 4s", t2 - t1 < 4000)

        Log.d(TAG, "Test 3: Successfully get recommendation in ${t2 - t1}ms!")
        Log.d(TAG, "Test 3: Successfully displayed a recommended jogging buddy!")

        // 6. Navigate to MapActivity
        Intents.intending(IntentMatchers.hasComponent(MapsActivity::class.java.name))
            .respondWith(Instrumentation.ActivityResult(Activity.RESULT_OK, null))

        onView(withId(R.id.viewOnMapButton))
            .check(matches(isDisplayed()))
            .perform(click())

        Intents.intended(IntentMatchers.hasComponent(MapsActivity::class.java.name))

        Thread.sleep(12000)

        // 7. Click the first "Message" button and navigate to Message Activity
        onView(withId(R.id.recommendationRecyclerView))
            .perform(RecyclerViewActions.actionOnItemAtPosition<RecommendationAdapter.ViewHolder>(0, click()))
        onView(allOf(
            withId(R.id.addUserButton),
            isDisplayed()
        )).perform(click())
    }
}
