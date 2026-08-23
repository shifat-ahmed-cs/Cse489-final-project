package com.bodypilot.app.data.repository

import com.bodypilot.app.data.api.RetrofitClient
import com.bodypilot.app.data.models.*

class AuthRepository {
    private val api = RetrofitClient.apiService

    suspend fun login(req: LoginRequest) = api.login(req)
    suspend fun register(req: RegisterRequest) = api.register(req)
    suspend fun submitAssessment(req: AssessmentRequest) = api.submitAssessment(req)
}

class WorkoutRepository {
    private val api = RetrofitClient.apiService

    suspend fun getActiveWorkoutPlan() = api.getActiveWorkoutPlan()
    suspend fun generateWorkoutPlan() = api.generateWorkoutPlan()
    suspend fun adaptWorkoutPlan(req: AdaptPlanRequest) = api.adaptWorkoutPlan(req)
    suspend fun generateQuickWorkout(minutes: Int) = api.generateQuickWorkout(mapOf("minutes" to minutes))
    suspend fun logWorkout(req: WorkoutLogRequest) = api.logWorkout(req)
    suspend fun getExercises(category: String?, search: String?) = api.getExercises(category, search)
    suspend fun getExerciseDetail(id: String) = api.getExerciseDetail(id)
}

class NutritionRepository {
    private val api = RetrofitClient.apiService

    suspend fun getMealPlan(date: String? = null) = api.getMealPlan(date)
    suspend fun generateMealPlan() = api.generateMealPlan()
    suspend fun getSubstituteOptions(foodId: String) = api.getSubstituteOptions(mapOf("foodId" to foodId))
    suspend fun substituteFood(mealPlanId: String, mealType: String, oldFoodId: String, newFoodId: String) =
        api.substituteFood(mapOf(
            "mealPlanId" to mealPlanId,
            "mealType" to mealType,
            "oldFoodId" to oldFoodId,
            "newFoodId" to newFoodId
        ))
    suspend fun logWater(waterMl: Int) = api.logNutrition(mapOf("waterMl" to waterMl))
    suspend fun searchFoods(query: String) = api.searchFoods(query)
    suspend fun getRecipes() = api.getRecipes()
    suspend fun getShoppingList() = api.getShoppingList()
}

class ProgressRepository {
    private val api = RetrofitClient.apiService

    suspend fun getDashboard() = api.getProgressDashboard()
    suspend fun logProgress(req: LogWeightRequest) = api.logProgress(req)
    suspend fun getGoals() = api.getGoals()
    suspend fun createGoal(req: CreateGoalRequest) = api.createGoal(req)
}

class AssistantRepository {
    private val api = RetrofitClient.apiService

    suspend fun chat(message: String) = api.chatWithAssistant(AssistantChatRequest(message))
    suspend fun getSuggestions() = api.getAssistantSuggestions()
}

class CreatorRepository {
    private val api = RetrofitClient.apiService

    suspend fun getCreators() = api.getCreators()
    suspend fun getCreatorPrograms() = api.getCreatorPrograms()
    suspend fun followProgram(id: String) = api.followProgram(id)
}

class CommunityRepository {
    private val api = RetrofitClient.apiService

    suspend fun getFeed() = api.getCommunityFeed()
    suspend fun createPost(content: String) = api.createPost(CreatePostRequest(content))
    suspend fun likePost(id: String) = api.likePost(id)
    suspend fun getChallenges() = api.getChallenges()
}
