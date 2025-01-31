# M3 - Requirements and Design

## 1. Change History
<!-- Leave blank for M3 -->

## 2. Project Description
An application that connects nearby users to jog/run together adapting to their schedule and distance willing to travel. In addition, encouraging competitive joggers to thrive by hosting a leaderboard. 

## 3. Requirements Specification
### **3.1. Use-Case Diagram**

![Use Case Diagram](images/UseCaseDiagram.png)
Authenticate -> Update profile - Amanvir
Find jog buddies - use smart recommendation system - Vinny
Message
Manage profile
Report users - William
Ban Users (admin side) - William


### **3.2. Actors Description**
1. **User**: A person who uses the app to locate and connect with others users nearby, ultilizes leaderboards and update their personal information.
2. **App Admin**: A person who has higher privileges to moderate the app by reviewing reports from users and issues bans to offenders.

### **3.3. Functional Requirements**

1. **User Authentication**:
   1. **Sign Up**:
        - **Description**: This feature allows users to create an account on the app using Google Sign In API.
        - **Primary actor(s)**: User
        - **Main success scenario**:
            - Successful Sign-Up
                - User submits sign up form, then the system creates an account in database and confirms with the user the sign up was successful
        - **Failure scenario(s)**:
            - Sign-Up Error
                - Invalid email entered
                - Unable to connect to server
    2. **Sign Up**:
        - **Description**: This feature allows users to log in to an existing account on the app using Google Sign In API.
        - **Primary actor(s)**: User
        - **Main success scenario**:
            - Successful Login
                - User enters login credentials and system authenticates use, creating a new session within the app
        - **Failure scenario(s)**:
            - Login Error
                - Invalid Credentials entered
    3. **Sign Out**:
        - **Description**: This feature allows users to log out from the app and close their current session.
        - **Primary actor(s)**: User
        - **Main success scenario**:
            - Successful Sign Out
                - User clicks sign out button, system uses User token to close user session and confirms with User once log out is successful
        - **Failure scenario(s)**:
            - Sign-Out Error
                - Unable to connect to server

2. **Update profile**:
   - **Description**: This feature allows users to update their profile to help personalize their nearby buddy recommendations.
   - **Primary actor(s)**: User
   - **Main success scenario**:
       1. User navigates to the profile section.
       2. User inputs their personal information and jogging preferences.
       3. User clicks on the "Save" button.
       4. System updates the user's profile in the database.
   - **Failure scenario(s)**:
       - 4a. Invalid input: Invalid characters entered in profile details.
       - 4b. Network issue: Display "Network error. Please check your internet connection and try again."

3. **Find Joggers Nearby**:
    - **Description**: This feature allows users to discover other joggers nearby based on their location and preferred jogging time.
    - **Primary actor(s)**: User
    - **Main success scenario**:
        1. User navigates to the "Find Joggers Nearby" section.
        2. User click on the "Find Joggers" button.
        3. System retrieves and displays a list of available joggers nearby along with relevant details (e.g., name, experience level, jogging pace, availability).
    - **Failure scenario(s)**:
        - 3a. No suitable matches found: Display "No joggers available for the selected time and location. Please try again later or adjust your preferences."
        - 3b. Database error: Display "Unable to retrieve joggers. Please try again later."
        - 3c. Network issue: Display "Network error. Please check your internet connection and try again."

4. **Join/Create Chat Group**
    - **Description**: This feature allows users to join or create a chat group with other users when looking at the profile of other joggers.
    - **Primary Actors**: User(s)
    - **Main Success Scenario**:
        1. User clicks on an User Profile
        2. User sends a connection request or message to create a chat join a group chat with the jogger.
        3. If the jogger accepts, the system confirms the connection, allowing further communication.
    - **Failure Scenarios**:
    - 2a. User is not connected to the internet

5. **Reporting Users**<a id="fr1"></a>:
   - **Description**: Users can report inappropriate behavior or content within the app. This report is sent to the admin panel for further review.
   - **Primary actor(s)**: User
   - **Main success scenario**:
       1. User navigates to the profile or message thread of the offending user.
       2. User selects the "Report" option.
       3. User chooses a reason from a predefined list (e.g., harassment, spam, inappropriate content).
       4. User submits the report.
       5. System confirms submission and stores the report in the database.
       6. Admin is notified of the new report.
   - **Failure scenario(s)**:
       - 1a. No internet connection: Display "Failed to submit report. Please try again."
       - 1b. Report submission error: Display "An error occurred. Please try again later."

6. **Banning Users (Admin Side)**:
   - **Description**: Admins have the capability to ban users who have been reported for violations, ensuring a safe and friendly community environment.
   - **Primary actor(s)**: App Admin
   - **Main success scenario**:
       1. Admin logs into the admin panel.
       2. Admin reviews a list of reported users with details of the reports.
       3. Admin selects a user to ban.
       4. Admin clicks the "Ban User" button.
       5. System updates the user's status to "Banned" and restricts access to the app.
       6. User receives a notification or email explaining the reason for the ban.
   - **Failure scenario(s)**:
       - 1a. Database error: Display "Failed to ban user. Please try again later."
       - 1b. Unauthorized access: Display "You do not have permission to perform this action."


### **3.4. Screen Mockups**


### **3.5. Non-Functional Requirements**
<a name="nfr1"></a>

1. **Security**  
    - **Description**: The application will ensure that user data and communications are encrypted, and secure protocols (e.g., HTTPS) will be used.
    - **Justification**: Security is a key aspect of any application that handles user data. It ensures that users' personal information is protected from unauthorized access and potential breaches. This is crucial for building trust and maintaining user confidence in the application.
2. **Finding Buddies Performance** 
    - **Description**: The finding Buddies buddies functionality must respond with a list of nearby joggers in at most 15 seconds.
    - **Justification**: The finding application must be responsive and having customers wait for long periods of time negatively affetcts their experience as an user. Therefore, it is important to ensure that the most complex functionality is capped to a reasonable response time. To improve performance, when the functionality is taking too long, it might return the list with the remaining users  unsorted or return a shorter list of found users.


## 4. Designs Specification
### **4.1. Main Components** 
1. **Users**
    - **Purpose**: Provide authentication, manage sessions, manage passwords, and ensure users can only access resources they have permission for. 
    - **Interfaces**: 
        1. Front-end form validation
            - **Purpose**: Provide authentication needed to start an user session.
        2. Back-end token management (JWT)
            -**Purpose**: Keep user session updated.
        3. Recommendation Engine:
            -**Purpose**: Handle the public data of other users that would be ideal to connect with the current user.
2. **Messaging** - Amanvir
    - **Purpose**: Allow users to communicate with potential jogging partners and discuss meeting time, place, etc.
    - **Interfaces**: 
        1. Node.js (Websocket library)
            - **Purpose**: Allows message exchange between users ensuring rapid communication
        2. MongoDB database
            - **Purpose**: Store chat history between users
3. **Recommendations** // Vinny
    - **Purpose**: Provide users with a list of potential jogging partners based on their preferences and location.
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. MongoDB database

Recommendation
Purpose: Match users with nearby jogging buddies based on preferences (e.g., schedule, distance).
Interfaces:
Database queries for user preferences
GPS location services for proximity calculations

Messages

### **4.2. Databases**
1. **Users DB**
    - **Purpose**: To store user credentials, running preferences, and running performance.
2. **Messaging DB**
    - **Purpose**: To store chat logs and metadata.


### **4.3. External Modules**
1. **Google Sign in API** 
    - **Purpose**: To provide user authentication service.
1. **Google Map API** 
    - **Purpose**: To provide location services and map functionalities.
    

### **4.4. Frameworks**
1. **Microsoft Azure**
    - **Purpose**: ...
    - **Reason**: ...
2. ****
    - **Purpose**: ...
    - **Reason**: ...

### **4.5. Dependencies Diagram**
![Dependencies Diagram](images/Dependency_diagram.png)

### **4.6. Functional Requirements Sequence Diagram**
1. [**Users can join/create a chat group of joggers**](#fr1)

![Chat Sequence Diagram](images/Join_Create_Group_Seq_Diagram.png)

2. [**Users can access a recommendation list of jogger profiles**](#fr2)

![Recommendation Sequence Diagram](images/RecommendationsSequenceDiagram.png)

3. [**Users can report profiles**](#fr2)

![Reporting Users Sequence Diagram](images/Reporting_users.png)

4. [**Admin can ban profiles**](#fr2)

![Banning Users Sequence Diagram](images/Banning_users.png)

5. [**User Login/Sign up**](#fr5)

![Banning Users Sequence Diagram](images/login_jog.png)

6. [**User Sign out**](#fr5)

![Banning Users Sequence Diagram](images/SignOut_jog.png)

### **4.7. Non-Functional Requirements Design**
1. [**Security: Encryption of user data**](#nfr1)
    - **Validation**: All user data and communications will be encrypted using HTTPS to ensure secure data transmission. Passwords will be securely hashed before storage, and database encryption will be applied for sensitive information. 


### **4.8. Main Project Complexity Design**
**[WRITE_NAME_HERE]**
- **Description**: ...
- **Why complex?**: ...
- **Design**:
    - **Input**: ...
    - **Output**: ...
    - **Main computational logic**: ...
    - **Pseudo-code**: 

```
Algorithm findJogBuddies(ShortListedBuddies, userLocation, userTime, userSpeed)
    Input: 
        ShortListedBuddies (List of profiles)
        userLocation (latitude, longitude)
        userTime
        userSpeed
    Output: 
        Top 5 best-matched jog buddies

    Define matches as an empty list

    For each buddy in ShortListedBuddies:
        Calculate distanceScore = calculateDistance(userLocation, buddy.location)
        Calculate timeDifference = abs(userTime - buddy.time)
        Calculate speedDifference = abs(userSpeed - buddy.speed)

        If timeDifference ≤ thresholdTime AND speedDifference ≤ thresholdSpeed:
            Compute matchScore = (1 / (1 + distanceScore)) * weightLocation + 
                                (1 / (1 + timeDifference)) * weightTime + 
                                (1 / (1 + speedDifference)) * weightSpeed

            Add (buddy, matchScore) to matches list

    Sort matches in descending order by matchScore

    Return top 5 buddies from matches (if available)
End Algorithm

Function calculateDistance(location1, location2)
    Input: 
        location1 (lat1, lon1)
        location2 (lat2, lon2)
    Output: 
        Distance between two locations in km

    Apply Haversine Formula:
        R = 6371 (Earth’s radius in km)
        dLat = toRadians(lat2 - lat1)
        dLon = toRadians(lon2 - lon1)

        a = sin²(dLat / 2) + cos(toRadians(lat1)) * cos(toRadians(lat2)) * sin²(dLon / 2)
        c = 2 * atan2(sqrt(a), sqrt(1-a))

    Return R * c
End Function
```


## 5. Contributions
- Alfredo del Rayo:
  - Use-Case Diagram
  - Use-Case Description: 
    - Find Joggers Nearby and Create/Join Chat
    - Corresponding Sequence Diagram
  - Non functional Requirement:
    - Performance 
  - Main Component:
    - User Management
- Amanvir Samra
  - Main Actors
  - Login Use Case Description
  - Non-functional requirement: Location Accuracy
  - Main Component: Messaging
  - Do corresponding sequence diagram for requirement
  - Do corresponding non-functional requirement
- Yu Qian Yi
  - Functional requirement: Find jog buddies 
  - Database design & External modules description
  - Main component - Recommendation
  - Do corresponding sequence diagram for requirement
  - Do corresponding sequence diagram non-functional requirement
  - Pseudocode 
- William Sun
  - Functional Requirements and sequence diagram (4.6)
    - reporting users
    - banning users
  - Main Components - Leaderboard
  - 4.8
