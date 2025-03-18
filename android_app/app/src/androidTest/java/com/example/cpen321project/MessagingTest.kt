package com.example.cpen321project

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.espresso.contrib.RecyclerViewActions
import androidx.recyclerview.widget.RecyclerView
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import org.junit.runner.RunWith
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import org.hamcrest.Matcher
import org.junit.Assert.assertTrue

private const val TAG = "Testing"

@RunWith(AndroidJUnit4::class)
class MessagingTest {

    @get:Rule
    var activityScenarioRule = ActivityScenarioRule(MainActivity::class.java)

    private lateinit var device: UiDevice
    private var messageContent: String = "hello, how is your day?"

    @Before
    fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test
    fun messagingTest() {
        Log.d(TAG, "Messaging Test Started")

        onView(withId(R.id.Sign_In_Button)).perform(click())
        // Wait for the account selector to show up
        Thread.sleep(5000)
        val accountSelector =
            device.findObject(UiSelector().textContains("hellothisworld2000@gmail.com")) // Replace with part of email
        if (accountSelector.exists()) {
            accountSelector.click()
        } else {
            throw NoSuchElementException("No Google account found for sign-in")
        }

        // Wait for HomeActivity to load
        Thread.sleep(5000)
        // Click "My Groups" Button in HomeActivity
        onView(withId(R.id.groups_button)).perform(click())

        Intents.intended(hasComponent(ManageChats::class.java.name))

        onView(withId(R.id.recyclerView)).perform(RecyclerViewActions.
            actionOnItemAtPosition<ChatOverviewAdapter.ViewHolder>(0, clickChildViewWithId(R.id.box)))

        // Wait for HomeActivity to load
        Thread.sleep(5000)

        Intents.intended(hasComponent(ChatActivity::class.java.name))
        val initialItemCount = getItemCount()
        onView(withId(R.id.messageInput)).perform(replaceText(messageContent), closeSoftKeyboard())
        onView(withId(R.id.sendMessageButton)).perform(click())

        Thread.sleep(5000)

        val newItemCount = getItemCount()

        assert(newItemCount == initialItemCount + 1) {
            "Message count inconsistent. Expected to be ${initialItemCount + 1}, but was $newItemCount"
        }

        onView(withId(R.id.recyclerView)).perform(RecyclerViewActions.
        actionOnItemAtPosition<ChatAdapter.ViewHolder>(newItemCount - 1, checkContent(R.id.messageText, messageContent )))

    }
    /**
     * Function Originally written by ChatGPT (OpenAI) on 17/03/2025.
     * Prompt:
     * Give me the implementation to click an element of a child of a RecyclerView in Espresso
     */
    private fun clickChildViewWithId(id: Int) = object : ViewAction {
        override fun getConstraints(): Matcher<View>? {
            return null
        }

        override fun getDescription(): String {
            return "Click on a child view with id $id"
        }

        override fun perform(uiController: UiController?, view: View) {
            val v = view.findViewById<View>(id)
            v?.performClick()
        }
    }

    private fun checkContent(id: Int, messageContent: String) = object : ViewAction {
        override fun getConstraints(): Matcher<View>? {
            return null
        }

        override fun getDescription(): String {
            return "Check the content of child view with id $id"
        }

        override fun perform(uiController: UiController?, view: View) {
            val textView = view.findViewById<TextView>(id)
            val textContent = textView.text.toString()
            assertTrue("Expected text to contain '$messageContent', but got '$textContent'",
                textContent.contains(messageContent)
            )
        }
    }

    /**
     * Function Originally written by ChatGPT (OpenAI) on 17/03/2025.
     * Prompt:
     * Give me the implementation to get the item count from a RecyclerView in a Espresso Test
     */
    fun getItemCount(): Int {
        var itemCount = 0
        onView(withId(R.id.recyclerView)).check { view, _ ->
            val recyclerView = view as RecyclerView
            itemCount = recyclerView.adapter?.itemCount ?: 0
        }
        return itemCount
    }
}
