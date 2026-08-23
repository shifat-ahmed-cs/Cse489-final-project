package com.bodypilot.app.data.models

import com.google.gson.annotations.SerializedName

// --- Auth Models ---
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val phone: String = ""
)

data class AuthResponse(
    val _id: String,
    val name: String,
    val email: String,
    val role: String,
    val token: String,
    val onboardingCompleted: Boolean = false,
    val assessmentCompleted: Boolean = false,
    val profile: UserProfile? = null
)

data class UserProfile(
    var age: Int = 0,
    var gender: String = "",
    var height: Double = 0.0,
    var weight: Double = 0.0,
    var fitnessLevel: String = "",
    var goal: String = "",
    var targetWeight: Double = 0.0,
    var dailyActivityLevel: String = "",
    var workoutDaysPerWeek: Int = 3,
    var preferredWorkoutDuration: Int = 45,
    var preferredWorkoutTime: String = "morning",
    var workoutLocation: String = "gym",
    var equipment: List<String> = emptyList(),
    var dislikedExercises: List<String> = emptyList()
)

data class AssessmentRequest(
    val profile: UserProfile,
    val injuries: List<InjuryItem> = emptyList(),
    val foodPreferences: FoodPreferences? = null
)

data class InjuryItem(
    val type: String = "previous",
    val area: String,
    val description: String = "",
    val severity: String = "mild"
)

data class FoodPreferences(
    val likedFoods: List<String> = emptyList(),
    val dislikedFoods: List<String> = emptyList(),
    val allergies: List<String> = emptyList(),
    val dietaryRestrictions: List<String> = emptyList(),
    val mealsPerDay: Int = 3
)

// --- Workout Models ---
data class WorkoutPlanResponse(
    val _id: String,
    val name: String,
    val description: String?,
    val schedule: List<WorkoutDayDto>,
    val goal: String?,
    val fitnessLevel: String?,
    val splitType: String?,
    val weekNumber: Int = 1,
    val isActive: Boolean = true
)

data class WorkoutDayDto(
    val _id: String?,
    val dayOfWeek: Int,
    val dayName: String,
    val workoutType: String,
    val title: String,
    val duration: Int,
    val exercises: List<WorkoutExerciseDto> = emptyList(),
    val isRestDay: Boolean = false,
    val intensity: String = "moderate"
)

data class WorkoutExerciseDto(
    val exerciseId: String?,
    val exerciseName: String,
    var sets: Int = 3,
    var reps: String = "10-12",
    var weight: Double = 0.0,
    var restPeriod: Int = 60,
    var duration: Int = 0,
    var notes: String = "",
    var completed: Boolean = false
)

data class AdaptPlanRequest(
    val action: String,
    val injuryArea: String? = null,
    val availableMinutes: Int? = null,
    val direction: String? = null,
    val dayOfWeek: Int? = null
)

data class AdaptPlanResponse(
    val message: String,
    val changes: List<String> = emptyList(),
    val plan: WorkoutPlanResponse? = null
)

data class WorkoutLogRequest(
    val workoutPlanId: String?,
    val dayTitle: String,
    val workoutType: String,
    val duration: Int,
    val completionPercentage: Int = 100,
    val totalVolume: Double = 0.0,
    val estimatedCalories: Int = 0,
    val feedback: WorkoutFeedbackDto? = null
)

data class WorkoutFeedbackDto(
    val overallDifficulty: String = "moderate",
    val energyLevel: Int = 3,
    val fatigue: Int = 3,
    val painOrDiscomfort: Boolean = false,
    val painAreas: List<String> = emptyList(),
    val notes: String = ""
)

// --- Exercise Model ---
data class ExerciseDto(
    val _id: String,
    val name: String,
    val muscleGroups: List<String> = emptyList(),
    val category: String,
    val equipment: List<String> = emptyList(),
    val difficulty: String,
    val instructions: List<String> = emptyList(),
    val tips: List<String> = emptyList(),
    val defaultSets: Int = 3,
    val defaultReps: String = "10-12",
    val restPeriod: Int = 60,
    val alternativeNames: List<String> = emptyList()
)

data class ExerciseListResponse(
    val exercises: List<ExerciseDto>,
    val total: Int
)

// --- Nutrition Models ---
data class MealPlanResponse(
    val _id: String,
    val date: String,
    val meals: List<MealDto> = emptyList(),
    val dailyTargets: DailyTargetsDto,
    val dailyActuals: DailyActualsDto
)

data class MealDto(
    val _id: String?,
    val mealType: String,
    val foods: List<MealFoodDto> = emptyList(),
    val totalCalories: Int = 0,
    val totalProtein: Int = 0,
    val totalCarbs: Int = 0,
    val totalFat: Int = 0,
    val isLogged: Boolean = false
)

data class MealFoodDto(
    val foodId: String?,
    val foodName: String,
    val quantity: Double = 1.0,
    val servingSize: Double = 100.0,
    val servingUnit: String = "g",
    val calories: Int = 0,
    val protein: Int = 0,
    val carbs: Int = 0,
    val fat: Int = 0
)

data class DailyTargetsDto(
    val calories: Int = 2000,
    val protein: Int = 150,
    val carbs: Int = 250,
    val fat: Int = 65,
    val water: Int = 3000
)

data class DailyActualsDto(
    val calories: Int = 0,
    val protein: Int = 0,
    val carbs: Int = 0,
    val fat: Int = 0,
    val water: Int = 0
)

data class SubstituteOptionsResponse(
    val original: MealFoodDto?,
    val substitutes: List<FoodDto> = emptyList()
)

data class FoodDto(
    val _id: String,
    val name: String,
    val category: String,
    val calories: Int,
    val protein: Double,
    val carbs: Double,
    val fat: Double,
    val servingSize: Double = 100.0,
    val servingUnit: String = "g"
)

data class FoodListResponse(
    val foods: List<FoodDto>,
    val total: Int
)

data class RecipeDto(
    val _id: String,
    val name: String,
    val description: String?,
    val calories: Int,
    val protein: Int,
    val carbs: Int,
    val fat: Int,
    val prepTime: Int = 10,
    val cookTime: Int = 15,
    val difficulty: String = "easy",
    val instructions: List<String> = emptyList()
)

data class ShoppingListResponse(
    val shoppingList: List<ShoppingItemDto> = emptyList(),
    val totalItems: Int = 0
)

data class ShoppingItemDto(
    val name: String,
    val quantity: Double,
    val unit: String,
    var checked: Boolean = false
)

// --- Progress Models ---
data class ProgressDashboardResponse(
    val weight: WeightTrendDto?,
    val workout: WorkoutConsistencyDto?,
    val goals: List<GoalDto> = emptyList()
)

data class WeightTrendDto(
    val trend: String?,
    val totalChange: Double?,
    val weeklyRate: Double?,
    val startWeight: Double?,
    val currentWeight: Double?,
    val message: String?,
    val entries: List<WeightEntryDto> = emptyList()
)

data class WeightEntryDto(
    val date: String,
    val weight: Double
)

data class WorkoutConsistencyDto(
    val totalWorkouts: Int = 0,
    val avgPerWeek: Double = 0.0,
    val currentStreak: Int = 0,
    val avgCompletion: Double = 0.0,
    val message: String?
)

data class GoalDto(
    val _id: String?,
    val goalId: String?,
    val title: String,
    val type: String?,
    val target: Double,
    val current: Double,
    val unit: String = "kg",
    val progress: Double = 0.0,
    val status: String = "on_track"
)

data class CreateGoalRequest(
    val type: String = "weight_loss",
    val title: String,
    val target: Double,
    val current: Double = 0.0,
    val unit: String = "kg"
)

data class LogWeightRequest(
    val weight: Double,
    val bodyFatPercentage: Double? = null,
    val notes: String? = null
)

// --- AI Assistant Models ---
data class AssistantChatRequest(
    val message: String
)

data class AssistantChatResponse(
    val response: String,
    val intent: String?,
    val action: String?,
    val changes: List<String>? = null
)

data class SuggestionDto(
    val text: String,
    val icon: String
)

// --- Creator & Program Models ---
data class CreatorDto(
    val _id: String,
    val userId: CreatorUserDto?,
    val bio: String?,
    val expertise: List<String> = emptyList(),
    val isVerified: Boolean = false,
    val rating: Double = 5.0,
    val followerCount: Int = 0
)

data class CreatorUserDto(
    val _id: String,
    val name: String,
    val profileImage: String?
)

data class ProgramDto(
    val _id: String,
    val title: String,
    val description: String,
    val duration: Int,
    val difficulty: String,
    val category: String,
    val rating: Double,
    val followerCount: Int,
    val schedule: List<ProgramDayDto> = emptyList(),
    val creatorId: CreatorDto? = null
)

data class ProgramDayDto(
    val dayNumber: Int,
    val title: String,
    val duration: Int,
    val isRestDay: Boolean = false
)

// --- Community Models ---
data class CommunityPostDto(
    val _id: String,
    val userId: CreatorUserDto?,
    val type: String,
    val content: String,
    val likeCount: Int = 0,
    val commentCount: Int = 0,
    val createdAt: String?
)

data class CreatePostRequest(
    val content: String,
    val type: String = "general"
)

data class ChallengeDto(
    val _id: String,
    val title: String,
    val description: String,
    val target: Int,
    val targetUnit: String = "workouts",
    val participantCount: Int = 0
)

// --- Generic ---
data class GenericMessageResponse(
    val message: String
)
