package com.bodypilot.app.ui.onboarding

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.BodyPilotApp
import com.bodypilot.app.data.models.AssessmentRequest
import com.bodypilot.app.data.models.FoodPreferences
import com.bodypilot.app.data.models.InjuryItem
import com.bodypilot.app.data.models.UserProfile
import com.bodypilot.app.data.repository.AuthRepository
import com.bodypilot.app.data.repository.NutritionRepository
import com.bodypilot.app.data.repository.WorkoutRepository
import com.bodypilot.app.utils.SessionManager
import kotlinx.coroutines.launch

class AssessmentViewModel : ViewModel() {
    private val authRepo = AuthRepository()
    private val workoutRepo = WorkoutRepository()
    private val nutritionRepo = NutritionRepository()
    private val sessionManager = SessionManager(BodyPilotApp.instance)

    val profile = UserProfile()
    val injuries = mutableListOf<InjuryItem>()
    val likedFoods = mutableListOf<String>()
    val dislikedFoods = mutableListOf<String>()
    val allergies = mutableListOf<String>()

    private val _submitState = MutableLiveData<SubmitState>()
    val submitState: LiveData<SubmitState> = _submitState

    fun finishAssessment() {
        _submitState.value = SubmitState.Loading
        viewModelScope.launch {
            try {
                val req = AssessmentRequest(
                    profile = profile,
                    injuries = injuries,
                    foodPreferences = FoodPreferences(
                        likedFoods = likedFoods,
                        dislikedFoods = dislikedFoods,
                        allergies = allergies,
                        mealsPerDay = 3
                    )
                )
                val res = authRepo.submitAssessment(req)
                if (res.isSuccessful) {
                    sessionManager.setAssessmentCompleted(true)
                    // Trigger initial plan generation
                    workoutRepo.generateWorkoutPlan()
                    nutritionRepo.generateMealPlan()

                    _submitState.value = SubmitState.Success
                } else {
                    _submitState.value = SubmitState.Error("Failed to save assessment")
                }
            } catch (e: Exception) {
                _submitState.value = SubmitState.Error(e.message ?: "Network error")
            }
        }
    }

    sealed class SubmitState {
        object Loading : SubmitState()
        object Success : SubmitState()
        data class Error(val message: String) : SubmitState()
    }
}
