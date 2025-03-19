# Example M5: Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                 | **Describe Group Location, No Mocks**                | **Describe Group Location, With Mocks**            | **Mocked Components**              |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| **GET /chat/:email** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **GET /chat/:email** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **GET /chat/:chatId** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **GET /chat/messages/:chatId/:messageId** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **GET /chat/members/:chatId** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **POST /chat/:email** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **POST /chat/message/:chatId**| [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **POST /chat/dm/:email** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
| **PUT /chat/:email** | [`bakend/tests/no-mocks/messagingControllers.test.ts`](#) | [`backend/tests/mocks/messagingControllers.mock.test.ts`](#) | Mongo DB failure |
#### 2.1.2. Commit Hash Where Tests Run

#### 2.1.3. Explanation on How to Run the Tests
All Backend Tests are located under  `backend/tests`

We assume that you have MongoDB installed and running in your machine.

First cd into the backend directory, and create an .env file with the following properties:
```
DB_URI: mongodb://localhost:27017/tests
PORT: 3000
GOOGLE_CLIENT_ID: << Your GOOGLE CLIENT ID >> 
JWT_SECRET: helloWorld
IS_TESTING: true
```
Make sure to replace << Your GOOGLE CLIENT ID >> with your own google OAuth web client ID. Then to start the test run the following commands:
```sh
git clone https://github.com/example/your-project.git Trailblazers
cd Trailblazers/backend
npx ts-jest config:init 
npm test # Make sure to add the .env file before running this command
```

### 2.2. GitHub Actions Configuration Location

`.github/workflows/backendTests.yml`

### 2.3. Jest Coverage Report Screenshots With Mocks

![Jest Tests](images/jest_tests.png)

### 2.4. Jest Coverage Report Screenshots Without Mocks

![Jest Tests, no mocks](images/jest_tests_no_mocks.png)

---

## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance (Recommendations Response Time)** | [`backend/tests/nonfunctional/response_time.test.js`](#) |
| **Performance (Chat Updates Response Time)** | [`android_app/app/src/androidTest/java/com/example/cpen321project/MessagingTest.kt`](#) |
| **Chat Data Security**          | [`tests/nonfunctional/chat_security.test.js`](#) |

### 3.2. Test Verification and Logs

- **Performance (Response Time)**

  - **Verification:** This test suite simulates multiple concurrent API calls using Jest along with a load-testing utility to mimic real-world user behavior. The focus is on key endpoints such as user login and study group search to ensure that each call completes within the target response time of 2 seconds under normal load. The test logs capture metrics such as average response time, maximum response time, and error rates. These logs are then analyzed to identify any performance bottlenecks, ensuring the system can handle expected traffic without degradation in user experience.
  - **Log Output**
    ```
    [Placeholder for response time test logs]
    ```

- **Chat Data Security**
  - **Verification:** ...
  - **Log Output**
    ```
    [Placeholder for chat security test logs]
    ```

---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:

`frontend/src/androidTest/java/com/studygroupfinder/`

### 4.2. Tests

- **Use Case: Login**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user opens â€œAdd Todo Itemsâ€ screen. | Open â€œAdd Todo Itemsâ€ screen. |
    | 2. The app shows an input text field and an â€œAddâ€ button. The add button is disabled. | Check that the text field is present on screen.<br>Check that the button labelled â€œAddâ€ is present on screen.<br>Check that the â€œAddâ€ button is disabled. |
    | 3a. The user inputs an ill-formatted string. | Input â€œ_^_^^OQ#$â€ in the text field. |
    | 3a1. The app displays an error message prompting the user for the expected format. | Check that a dialog is opened with the text: â€œPlease use only alphanumeric charactersâ€. |
    | 3. The user inputs a new item for the list and the add button becomes enabled. | Input â€œbuy milkâ€ in the text field.<br>Check that the button labelled â€œaddâ€ is enabled. |
    | 4. The user presses the â€œAddâ€ button. | Click the button labelled â€œaddâ€. |
    | 5. The screen refreshes and the new item is at the bottom of the todo list. | Check that a text box with the text â€œbuy milkâ€ is present on screen.<br>Input â€œbuy chocolateâ€ in the text field.<br>Click the button labelled â€œaddâ€.<br>Check that two text boxes are present on the screen with â€œbuy milkâ€ on top and â€œbuy chocolateâ€ at the bottom. |
    | 5a. The list exceeds the maximum todo-list size. | Repeat steps 3 to 5 ten times.<br>Check that a dialog is opened with the text: â€œYou have too many items, try completing one firstâ€. |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **Use Case: ...**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | ...                | ...                 |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **...**

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacyâ€™s Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacyâ€™s Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**

  1. **Issue**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...

  2. ...

- ...