# M3 - Requirements and Design

## 1. Change History
<!-- Leave blank for M3 -->

## 2. Project Description
An application that connects nearby users to jog/run together adapting to their schedule and distance willing to travel. In addition, encouraging competitive joggers to thrive by hosting a leaderboard. 

## 3. Requirements Specification
### **3.1. Use-Case Diagram**

![alt text](images/UseCaseDiagram.png)
Login/Sign up -> Update profile - Amanvir
Report users - William
Ban Users (admin side) - William
Post and view leaderboard ranking - Vinny
Find jog buddies - use smart recommendation system - Vinny


### **3.2. Actors Description** //Amanvir
1. **User**:
2. **App Admin**:

### **3.3. Functional Requirements**
<a name="fr1"></a>

1. **** 
    - **Overview**:
        1. **Reporting Users**
        2. **Banning Users (Admin Side)**
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Reporting Users**:
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

        2. **Banning Users (Admin Side)**:
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
        3. **Find Joggers Nearby**:
            - **Description**: This feature lists Joggers 


### **3.4. Screen Mockups**


### **3.5. Non-Functional Requirements**
<a name="nfr1"></a>

1. **Location Accuracy** - Amanvir
    - **Description**: ...
    - **Justification**: ...
2. **Security** - Vinny 
    - **TBA**: ...
    - **Encrypted**: ...
3. **Performance: Finding Buddies must take at most 15s** - Alfredo
    - **Description**: ....
    - **Justification**: ...

Security

Description: All user data and communications must be encrypted, and secure protocols (e.g., HTTPS) must be used.
Justification: Protect user privacy and prevent data breaches.


## 4. Designs Specification
### **4.1. Main Components** //Figure out what's this
1. **User Management**
    - **Purpose**: Provide authentication, manage sessions, mana passwords, and ensure users can only access resources they have permission for. 
    - **Interfaces**: 
        1. Front-end form validation
            - **Purpose**: 
        2. Back-end token management (JWT)
        3. Recommendation Engine
2. **Messaging** - Amanvir
    - **Purpose**:
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
3. **Recommended Jogging Partners** // Vinny
    - **Purpose**:
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
4. **Leaderboard** //William
    - **Purpose**:
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...

Users
Purpose: Handle login, sign-up, and user authentication securely.
Interfaces:
Front-end form validation
Back-end token management (JWT)
Recommendation Engine

Recommendation
Purpose: Match users with nearby jogging buddies based on preferences (e.g., schedule, distance).
Interfaces:
Database queries for user preferences
GPS location services for proximity calculations

Messages

### **4.2. Databases**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
2. ...
Users - personal info
Messaging
Leaderboard - jogging speed etc


4.2 Databases
Users Database

Purpose: Store user credentials, preferences, and profiles.
Messages Database

Purpose: Store chat logs and metadata.
Leaderboard Database

Purpose: Track user performance and rankings.


### **4.3. External Modules**
1. **Google Map API** 
    - **Purpose**: ...

    

### **4.4. Frameworks**
1. **Microsoft Azure**
    - **Purpose**: ...
    - **Reason**: ...
2. ****
    - **Purpose**: ...
    - **Reason**: ...

### **4.5. Dependencies Diagram**


### **4.6. Functional Requirements Sequence Diagram**
1. [**[WRITE_NAME_HERE]**](#fr1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Non-Functional Requirements Design**
1. [**Performance: Finding Buddies must take at most 15s**](#nfr1)
    - **Validation**: ...
2. ...


### **4.8. Main Project Complexity Design**
**[WRITE_NAME_HERE]**
- **Description**: ...
- **Why complex?**: ...
- **Design**:
    - **Input**: ...
    - **Output**: ...
    - **Main computational logic**: ...
    - **Pseudo-code**: ...
        ```
        
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
- 
- Amanvir Samra
  - Main Actors
  - Login Use Case Description
  - Non-functional requirement: Location Accuracy
  - Main Component: Messaging
  - Do corresponding sequence diagram for requirement
  - Do corresponding non-functional requirement
- Yu Qian Yi
  - Functional requirement: Post and view leaderboard ranking 
  - Functional requirement: Find jog buddies 
  - Non-functional requirement: Security 
  - Main component - Recommended Jogging Partners 
  - Do corresponding sequence diagram for requirement
  - Do corresponding non-functional requirement
- William Sun
  - Functional Requirements and sequence diagram (4.6)
    - reporting users
    - banning users
  - Main Components - Leaderboard
