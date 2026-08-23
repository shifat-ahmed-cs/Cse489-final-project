package com.bodypilot.app.ui.workout

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.*
import com.bodypilot.app.data.repository.WorkoutRepository
import kotlinx.coroutines.launch

class WorkoutViewModel : ViewModel() {
    private val repo = WorkoutRepository()

    private val _plan = MutableLiveData<WorkoutPlanResponse?>()
    val plan: LiveData<WorkoutPlanResponse?> = _plan

    private val _exercises = MutableLiveData<List<ExerciseDto>>()
    val exercises: LiveData<List<ExerciseDto>> = _exercises

    private val _adaptResult = MutableLiveData<AdaptPlanResponse?>()
    val adaptResult: LiveData<AdaptPlanResponse?> = _adaptResult

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun fetchPlan() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.getActiveWorkoutPlan()
                if (res.isSuccessful) {
                    _plan.value = res.body()
                }
            } catch (e: Exception) {
                // handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun adaptPlan(action: String, injuryArea: String? = null, minutes: Int? = null, direction: String? = null) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.adaptWorkoutPlan(AdaptPlanRequest(action, injuryArea, minutes, direction))
                if (res.isSuccessful) {
                    _adaptResult.value = res.body()
                    fetchPlan() // Refresh active plan
                }
            } catch (e: Exception) {
                // handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun searchExercises(category: String? = null, search: String? = null) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.getExercises(if (category == "All") null else category, search)
                if (res.isSuccessful) {
                    _exercises.value = res.body()?.exercises ?: emptyList()
                }
            } catch (e: Exception) {
                // handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logWorkout(dayTitle: String, workoutType: String, duration: Int, feedback: WorkoutFeedbackDto) {
        viewModelScope.launch {
            try {
                repo.logWorkout(
                    WorkoutLogRequest(
                        workoutPlanId = _plan.value?._id,
                        dayTitle = dayTitle,
                        workoutType = workoutType,
                        duration = duration,
                        feedback = feedback
                    )
                )
            } catch (e: Exception) {
                // handle error
            }
        }
    }
}
