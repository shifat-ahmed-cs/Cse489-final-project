package com.bodypilot.app.ui.creator

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.CreatorDto
import com.bodypilot.app.data.models.ProgramDto
import com.bodypilot.app.data.repository.CreatorRepository
import kotlinx.coroutines.launch

class CreatorViewModel : ViewModel() {
    private val repo = CreatorRepository()

    private val _creators = MutableLiveData<List<CreatorDto>>()
    val creators: LiveData<List<CreatorDto>> = _creators

    private val _programs = MutableLiveData<List<ProgramDto>>()
    val programs: LiveData<List<ProgramDto>> = _programs

    private val _followSuccess = MutableLiveData<Boolean>()
    val followSuccess: LiveData<Boolean> = _followSuccess

    fun loadCreators() {
        viewModelScope.launch {
            try {
                val res = repo.getCreators()
                if (res.isSuccessful) {
                    _creators.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun loadPrograms() {
        viewModelScope.launch {
            try {
                val res = repo.getCreatorPrograms()
                if (res.isSuccessful) {
                    _programs.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun followProgram(id: String) {
        viewModelScope.launch {
            try {
                val res = repo.followProgram(id)
                if (res.isSuccessful) {
                    _followSuccess.value = true
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }
}
