# 🗄️ BodyPilot — Database Schema & UI Wireframe Specification

---

## 1. 📊 Entity-Relationship (ER) Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ WORKOUT_PLANS : "has active/past"
    USERS ||--o{ WORKOUT_LOGS : "logs sessions"
    USERS ||--o{ MEAL_PLANS : "has daily/weekly"
    USERS ||--o{ PROGRESS_LOGS : "records metrics"
    USERS ||--o{ GOALS : "tracks milestones"
    USERS ||--o| CREATORS : "can register as"
    USERS ||--o{ COMMUNITY_POSTS : "authors"
    USERS ||--o{ CHALLENGES : "participates in"
    USERS ||--o{ NOTIFICATIONS : "receives"

    WORKOUT_PLANS ||--|{ WORKOUT_DAYS : "contains embedded"
    WORKOUT_DAYS ||--|{ WORKOUT_EXERCISES : "contains embedded"
    WORKOUT_EXERCISES }o--|| EXERCISES : "references"

    CREATORS ||--o{ PROGRAMS : "creates/publishes"
    PROGRAMS ||--|{ PROGRAM_DAYS : "contains schedule"
    PROGRAMS }o--o{ USERS : "followed by"

    MEAL_PLANS ||--|{ MEALS : "contains embedded"
    MEALS ||--|{ MEAL_FOODS : "contains embedded"
    MEAL_FOODS }o--|| FOODS : "references"
    RECIPES }o--o{ FOODS : "uses ingredients"
    RECIPES }o--o{ USERS : "favorited by"

    COMMUNITY_POSTS ||--o{ COMMENTS : "has embedded"
    COMMUNITY_POSTS }o--o{ USERS : "liked by"

    USERS {
        ObjectId _id PK
        string name
        string email
        string password
        string role "user | creator | admin"
        object profile "height, weight, goal, fitnessLevel"
        array injuries "area, severity, description"
        object foodPreferences "liked, disliked, allergies"
        int currentStreak
        int longestStreak
        date createdAt
    }

    EXERCISES {
        ObjectId _id PK
        string name
        string category "chest | back | legs | core | cardio..."
        array muscleGroups
        array equipment "barbell | dumbbell | bodyweight..."
        string difficulty "beginner | intermediate | advanced"
        array instructions
        int restPeriod
        array alternativeNames
    }

    WORKOUT_PLANS {
        ObjectId _id PK
        ObjectId userId FK
        string name
        string splitType "push_pull_legs | upper_lower | full_body"
        int weekNumber
        boolean isActive
        array schedule "embedded WorkoutDay items"
        string sourceType "generated | creator_program"
    }

    WORKOUT_LOGS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId workoutPlanId FK
        string dayTitle
        int duration "minutes"
        double totalVolume "kg lifted"
        int estimatedCalories
        object feedback "RPE difficulty, painAreas, notes"
        boolean isCompleted
        date date
    }

    FOODS {
        ObjectId _id PK
        string name
        string category "protein | carbohydrate | fat | vegetable"
        int calories
        double protein
        double carbs
        double fat
        double servingSize
        string servingUnit "g | ml | piece"
        array allergens
        array dietaryTags "halal | vegan | gluten_free"
    }

    MEAL_PLANS {
        ObjectId _id PK
        ObjectId userId FK
        date date
        object dailyTargets "calories, protein, carbs, fat, water"
        object dailyActuals "calories, protein, carbs, fat, water"
        array meals "Breakfast, Lunch, Dinner, Snack items"
        boolean isActive
    }

    PROGRESS_LOGS {
        ObjectId _id PK
        ObjectId userId FK
        date date
        double weight "kg"
        double bmi
        double bodyFatPercentage
        object measurements "chest, waist, arms"
        object photos "front, side, back URLs"
    }

    GOALS {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string type "weight_loss | muscle_gain | strength"
        double target
        double current
        string unit "kg | reps | days"
        boolean isCompleted
        array milestones
    }

    CREATORS {
        ObjectId _id PK
        ObjectId userId FK
        string bio
        array expertise
        boolean isVerified
        double rating
        int followerCount
    }

    PROGRAMS {
        ObjectId _id PK
        ObjectId creatorId FK
        string title
        string description
        int duration "days"
        string difficulty
        string category
        array schedule
        int followerCount
        boolean isPublished
    }

    COMMUNITY_POSTS {
        ObjectId _id PK
        ObjectId userId FK
        string type "achievement | workout | recipe | question"
        string content
        string imageUrl
        int likeCount
        int commentCount
        array comments
    }
```

---

## 2. 🏛️ Schema Entity Descriptions & Relationships

| Collection / Entity | Key Type | Purpose & Cardinality |
| :--- | :--- | :--- |
| **`USERS`** | Primary (`_id`) | Central user account containing personal demographics, active fitness goals, injury safety limits, and food preferences. Root for all user relations (1:N). |
| **`WORKOUT_PLANS`** | Primary (`_id`), FK (`userId`) | Active 7-day personalized workout schedule containing embedded `WorkoutDay` and `WorkoutExercise` documents. Supports dynamic adaptation history. |
| **`EXERCISES`** | Primary (`_id`) | Global catalog of 111+ exercises with target muscle groups, difficulty, required equipment, and safe alternatives. |
| **`WORKOUT_LOGS`** | Primary (`_id`), FK (`userId`, `workoutPlanId`) | Immutable historical log of completed workouts, volume calculated (kg), duration, and RPE feedback for adaptive overload. |
| **`FOODS`** | Primary (`_id`) | Global nutrition database of 135+ items with exact macro breakdowns (calories, protein, carbs, fats per serving) and allergen tags. |
| **`MEAL_PLANS`** | Primary (`_id`), FK (`userId`) | Daily/weekly nutrition plan with target vs. actual calories/macros and embedded meal items (Breakfast, Lunch, Dinner, Snacks). |
| **`RECIPES`** | Primary (`_id`), FK (`createdBy`) | Healthy culinary database referencing required food ingredients and step-by-step preparation instructions. |
| **`PROGRESS_LOGS`** | Primary (`_id`), FK (`userId`) | Time-series progression tracking bodyweight, BMI, body fat percentage, body circumference measurements, and photo links. |
| **`GOALS`** | Primary (`_id`), FK (`userId`) | Milestone-based targets (e.g., *Bench 100kg*, *Reach 75kg*) with live percentage completion calculations. |
| **`CREATORS`** | Primary (`_id`), FK (`userId`) | Coach and trainer profiles with verified badges, ratings, and follower counts. |
| **`PROGRAMS`** | Primary (`_id`), FK (`creatorId`) | Multi-week structured training regimens designed by coaches with a **1-Tap Follow** feature to adopt as the active user plan. |
| **`COMMUNITY_POSTS`**| Primary (`_id`), FK (`userId`) | Social feed entries for achievements, workout milestones, and tips with likes and embedded comments. |

---

## 3. 📱 Application Screen Navigation Map

```mermaid
graph TD
    Splash[Splash Screen] -->|Logged In & Assessed| Dashboard[Home Dashboard]
    Splash -->|Logged In & Not Assessed| Onboarding[5-Step Assessment]
    Splash -->|Not Logged In| Login[Login Screen]

    Login -->|No Account| Register[Register Screen]
    Login -->|Forgot| ForgotPass[Forgot Password]
    Login -->|Success| Dashboard
    Register -->|Success| Onboarding
    Onboarding -->|Finish| Dashboard

    subgraph Bottom Navigation Tabs
        Dashboard -->|Tab 1| Dashboard
        Dashboard -->|Tab 2| WorkoutTab[Workouts Schedule]
        Dashboard -->|Tab 3| NutritionTab[Nutrition & Meal Plan]
        Dashboard -->|Tab 4| ProgressTab[Progress & Analytics]
        Dashboard -->|Tab 5| CoachTab[AI Fitness Coach]
    end

    Dashboard -->|Tap Start| ActiveWorkout[Live Workout Tracker]
    ActiveWorkout -->|Finish| FeedbackModal[Post-Workout Feedback]
    FeedbackModal -->|Auto-Recalibrate| Dashboard

    Dashboard -->|Tap Button| AdaptModal[Adapt My Plan Dialog]
    AdaptModal -->|Injury / Time / Reschedule| Dashboard

    WorkoutTab -->|View Library| ExLibrary[100+ Exercise Library]
    ExLibrary -->|Select| ExDetail[Exercise Detail & Alternatives]

    NutritionTab -->|Tap Swap| FoodSwap[Food Substitution Screen]
    NutritionTab -->|Browse| RecipeList[Recipe Catalog]
    RecipeList -->|Select| RecipeDetail[Recipe Instructions]
    NutritionTab -->|View List| GroceryList[Smart Grocery Shopping List]
    NutritionTab -->|Quick Water| FoodLog[Water & Custom Food Log]

    ProgressTab -->|Set Targets| GoalsScreen[Goals & Milestones]
    ProgressTab -->|+ Weight| LogWeightDialog[Log Metric Dialog]

    Dashboard -->|Shortcuts| CommunityFeed[Community Social Feed]
    Dashboard -->|Shortcuts| CreatorBrowse[Creator Program Hub]
    CreatorBrowse -->|Select| ProgramDetail[Program Detail + 1-Tap Follow]
    Dashboard -->|Shortcuts| Settings[Profile & Settings]
    Dashboard -->|Shortcuts| AdminPanel[Admin Dashboard]
```
