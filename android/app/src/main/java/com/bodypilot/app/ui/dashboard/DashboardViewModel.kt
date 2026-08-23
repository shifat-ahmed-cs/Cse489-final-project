package com.bodypilot.app.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.MealPlanResponse
import com.bodypilot.app.data.models.WorkoutPlanResponse
import com.bodypilot.app.data.repository.NutritionRepository
import com.bodypilot.app.data.repository.WorkoutRepository
import kotlinx.coroutines.launch

class DashboardViewModel : ViewModel() {
    private val workoutRepo = WorkoutRepository()
    private val nutritionRepo = NutritionRepository()

    private val _workoutPlan = MutableLiveData<WorkoutPlanResponse?>()
    val workoutPlan: LiveData<WorkoutPlanResponse?> = _workoutPlan

    private val _mealPlan = MutableLiveData<MealPlanResponse?>()
    val mealPlan: LiveData<MealPlanResponse?> = _mealPlan

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun loadDashboardData() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val workoutRes = workoutRepo.getActiveWorkoutPlan()
                if (workoutRes.isSuccessful) {
                    _workoutPlan.value = workoutRes.body()
                }

                val mealRes = nutritionRepo.getMealPlan()
                if (mealRes.isSuccessful) {
                    _mealPlan.value = mealRes.body()
                }
            } catch (e: Exception) {
                // Keep cached/existing state
            } finally {
                _isLoading.value = false
            }
        }
    }
}
