# 🚀 BodyPilot — Adaptive Fitness & Nutrition Companion

> **CSE489 Final Project**  
> An end-to-end, intelligent fitness application designed to move with you, learn from you, and adapt to your body's changing needs in real-time.

---

## 🌟 Key Highlights & Core Features

### 1. 🧠 Core Adaptive Engines (Hybrid Intelligence)
- **Workout Generator (`workoutGenerator.js`)**: Generates custom 7-day training splits (PPL, Upper/Lower, Full Body, Arnold Split) based on fitness goal, experience level, equipment availability, and injury history.
- **Dynamic Workout Adapter (`workoutAdapter.js`)**:
  - *Injury Adaptation*: Instantly detects injury/pain areas (knee, shoulder, lower back, wrist) and replaces all conflicting exercises with safe alternatives while preserving target muscle activation.
  - *Time Adaptation*: Compresses full routines into 15–30 minute high-density sessions on busy days.
  - *Progressive Overload*: Auto-calculates +2.5% to +5% weight progression based on completed workout logs.
  - *Smart Rescheduling*: Shifts missed workouts without causing burnout or skipping muscle groups.
- **Nutrition Generator & Macro Engine (`nutritionGenerator.js`)**: Calculates BMR and TDEE using Mifflin-St Jeor equation. Dynamically splits daily caloric and macro targets across meals.
- **Smart Food Substitution (`nutritionAdapter.js`)**: Allows 1-tap food substitutions (e.g. swapping chicken for salmon or tofu) that automatically recalculate serving sizes and daily macro balances.
- **AI Coach Assistant (`assistantEngine.js`)**: Rule-based intent-classified conversational assistant answering workout questions, providing meal recommendations, and directly modifying user workout plans.

### 2. 📱 Android Frontend Architecture (MVVM)
- **Tech Stack**: Kotlin, Material 3 Dark Theme, Jetpack Navigation, ViewBinding, ViewModel & LiveData, Retrofit 2, OkHttp3 with Auth Interceptor, MPAndroidChart, Coroutines.
- **10 Complete Feature Modules**:
  1. *Authentication & Session*: JWT authentication, token persistence in `SessionManager`.
  2. *5-Step Adaptive Assessment*: Interactive onboarding gathering goal, metrics, equipment, injuries, and dietary allergies.
  3. *Home Dashboard*: Today's workout hero card, live calorie and macro progress bars, streak counter, and direct "Adapt My Plan" modal trigger.
  4. *Workout Tracker*: Live chronometer, countdown rest timer between sets, exercise completion checklist, and post-workout feedback modal.
  5. *Exercise Library*: 100+ seeded exercises with muscle groups, difficulty, equipment, and category chips.
  6. *Nutrition & Meal Plans*: Meal cards with food lists, 1-tap food substitution, quick water logger, and auto-generated grocery shopping lists.
  7. *Progress & Analytics*: Interactive MPAndroidChart line and bar graphs tracking weight trends and training volume over time.
  8. *AI Coach*: Conversational chat screen with contextual quick-action pills.
  9. *Creator Platform*: Influencer and coach program browsing with 1-tap program adoption.
  10. *Community & Admin*: Milestone feed, likes, comments, and admin analytics dashboard.

---

## 📁 Repository Structure

```
Final Project/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── data/
│   │   ├── exercises.json        # 100+ Exercise seed data
│   │   ├── foods.json            # 120+ Food item database
│   │   └── seed.js               # Database seeding script
│   ├── engine/
│   │   ├── workoutGenerator.js   # Rule-based plan generation
│   │   ├── workoutAdapter.js     # Injury, time, difficulty adaptation
│   │   ├── nutritionGenerator.js # BMR, TDEE, macro calculations
│   │   ├── nutritionAdapter.js   # Food substitution & macro balancing
│   │   ├── progressAnalyzer.js   # Weight trends & volume analytics
│   │   └── assistantEngine.js    # AI Assistant intent classification
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── roleCheck.js          # Role-based access control
│   ├── models/                   # 13 Mongoose Schemas
│   ├── routes/                   # 12 REST API Route Handlers
│   ├── server.js                 # Express entry point
│   ├── package.json
│   └── .env
│
└── android/
    ├── app/
    │   ├── build.gradle.kts
    │   └── src/main/
    │       ├── AndroidManifest.xml
    │       ├── java/com/bodypilot/app/
    │       │   ├── BodyPilotApp.kt
    │       │   ├── MainActivity.kt
    │       │   ├── data/
    │       │   │   ├── api/        # Retrofit ApiService & Client
    │       │   │   ├── models/     # Kotlin DTOs
    │       │   │   └── repository/ # Repositories
    │       │   ├── ui/             # 20+ ViewModels & Fragments
    │       │   └── utils/          # Constants & SessionManager
    │       └── res/                # Layouts, navigation, drawables, themes
    ├── build.gradle.kts
    └── settings.gradle.kts
```

---

## 🛠️ How to Run the Project

### 1. Start the Backend API
```bash
cd "Final Project/backend"
npm install
node data/seed.js   # Populate 100+ exercises, 120+ foods, and demo accounts
npm run dev         # Starts server on port 5000
```

### 2. Test Accounts
- **Admin**: `admin@bodypilot.com` / `admin123`
- **Demo User**: `demo@bodypilot.com` / `demo123` (or tap **"Quick Demo Login"** on login screen)
- **Creator**: `creator@bodypilot.com` / `creator123`

### 3. Run Android App
1. Open Android Studio.
2. Select **Open** and choose `Final Project/android`.
3. Sync Gradle and run on Android Emulator or connected physical device!
