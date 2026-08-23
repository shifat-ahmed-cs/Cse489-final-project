package com.bodypilot.app.ui.progress

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.GoalDto
import com.bodypilot.app.data.models.LogWeightRequest
import com.bodypilot.app.data.models.ProgressDashboardResponse
import com.bodypilot.app.data.repository.ProgressRepository
import kotlinx.coroutines.launch

class ProgressViewModel : ViewModel() {
    private val repo = ProgressRepository()

    private val _dashboard = MutableLiveData<ProgressDashboardResponse?>()
    val dashboard: LiveData<ProgressDashboardResponse?> = _dashboard

    private val _goals = MutableLiveData<List<GoalDto>>()
    val goals: LiveData<List<GoalDto>> = _goals

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun loadDashboard() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.getDashboard()
                if (res.isSuccessful) {
                    _dashboard.value = res.body()
                }
            } catch (e: Exception) {
                // handle
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadGoals() {
        viewModelScope.launch {
            try {
                val res = repo.getGoals()
                if (res.isSuccessful) {
                    _goals.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun logWeight(weight: Double, bodyFat: Double? = null) {
        viewModelScope.launch {
            try {
                repo.logProgress(LogWeightRequest(weight, bodyFat))
                loadDashboard()
            } catch (e: Exception) {
                // handle
            }
        }
    }
}
