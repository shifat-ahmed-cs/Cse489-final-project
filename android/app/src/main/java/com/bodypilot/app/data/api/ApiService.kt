package com.bodypilot.app.data.api

import com.bodypilot.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // --- Auth Endpoints ---
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("users/assessment")
    suspend fun submitAssessment(@Body request: AssessmentRequest): Response<Any>

    // --- Workout Endpoints ---
    @GET("workouts/plan")
    suspend fun getActiveWorkoutPlan(): Response<WorkoutPlanResponse>

    @POST("workouts/generate")
    suspend fun generateWorkoutPlan(): Response<Any>

    @POST("workouts/adapt")
    suspend fun adaptWorkoutPlan(@Body request: AdaptPlanRequest): Response<AdaptPlanResponse>

    @POST("workouts/quick")
    suspend fun generateQuickWorkout(@Body body: Map<String, Int>): Response<WorkoutDayDto>

    @POST("workouts/log")
    suspend fun logWorkout(@Body request: WorkoutLogRequest): Response<Any>

    // --- Exercise Endpoints ---
    @GET("exercises")
    suspend fun getExercises(
        @Query("category") category: String? = null,
        @Query("search") search: String? = null
    ): Response<ExerciseListResponse>

    @GET("exercises/{id}")
    suspend fun getExerciseDetail(@Path("id") id: String): Response<ExerciseDto>

    // --- Nutrition Endpoints ---
    @GET("nutrition/plan")
    suspend fun getMealPlan(@Query("date") date: String? = null): Response<MealPlanResponse>

    @POST("nutrition/generate")
    suspend fun generateMealPlan(): Response<Any>

    @POST("nutrition/substitute-options")
    suspend fun getSubstituteOptions(@Body body: Map<String, String>): Response<SubstituteOptionsResponse>

    @POST("nutrition/substitute")
    suspend fun substituteFood(@Body body: Map<String, Any>): Response<MealPlanResponse>

    @POST("nutrition/log")
    suspend fun logNutrition(@Body body: Map<String, Any>): Response<Any>

    @GET("foods")
    suspend fun searchFoods(@Query("search") search: String): Response<FoodListResponse>

    @GET("recipes")
    suspend fun getRecipes(): Response<List<RecipeDto>>

    @GET("recipes/shopping-list")
    suspend fun getShoppingList(): Response<ShoppingListResponse>

    // --- Progress & Goals Endpoints ---
    @GET("progress/dashboard")
    suspend fun getProgressDashboard(): Response<ProgressDashboardResponse>

    @POST("progress")
    suspend fun logProgress(@Body request: LogWeightRequest): Response<Any>

    @GET("goals")
    suspend fun getGoals(): Response<List<GoalDto>>

    @POST("goals")
    suspend fun createGoal(@Body request: CreateGoalRequest): Response<GoalDto>

    // --- AI Assistant Endpoints ---
    @POST("assistant/chat")
    suspend fun chatWithAssistant(@Body request: AssistantChatRequest): Response<AssistantChatResponse>

    @GET("assistant/suggestions")
    suspend fun getAssistantSuggestions(): Response<List<SuggestionDto>>

    // --- Creator Endpoints ---
    @GET("creators")
    suspend fun getCreators(): Response<List<CreatorDto>>

    @GET("creators/programs/browse")
    suspend fun getCreatorPrograms(): Response<List<ProgramDto>>

    @POST("creators/programs/{id}/follow")
    suspend fun followProgram(@Path("id") id: String): Response<Any>

    // --- Community Endpoints ---
    @GET("community/feed")
    suspend fun getCommunityFeed(): Response<List<CommunityPostDto>>

    @POST("community/posts")
    suspend fun createPost(@Body request: CreatePostRequest): Response<CommunityPostDto>

    @POST("community/posts/{id}/like")
    suspend fun likePost(@Path("id") id: String): Response<Any>

    @GET("community/challenges")
    suspend fun getChallenges(): Response<List<ChallengeDto>>
}
