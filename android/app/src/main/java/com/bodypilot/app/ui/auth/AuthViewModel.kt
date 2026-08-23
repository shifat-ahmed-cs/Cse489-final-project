package com.bodypilot.app.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.BodyPilotApp
import com.bodypilot.app.data.models.AuthResponse
import com.bodypilot.app.data.models.LoginRequest
import com.bodypilot.app.data.models.RegisterRequest
import com.bodypilot.app.data.repository.AuthRepository
import com.bodypilot.app.utils.SessionManager
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    private val repo = AuthRepository()
    private val sessionManager = SessionManager(BodyPilotApp.instance)

    private val _authState = MutableLiveData<AuthState>()
    val authState: LiveData<AuthState> = _authState

    fun login(email: String, pass: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                val res = repo.login(LoginRequest(email, pass))
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    sessionManager.saveAuthToken(body.token)
                    sessionManager.saveUser(
                        body._id,
                        body.name,
                        body.email,
                        body.role,
                        body.assessmentCompleted
                    )
                    _authState.value = AuthState.Success(body)
                } else {
                    _authState.value = AuthState.Error(res.errorBody()?.string() ?: "Login failed")
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    fun register(email: String, pass: String, name: String, phone: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            try {
                val res = repo.register(RegisterRequest(email, pass, name, phone))
                if (res.isSuccessful && res.body() != null) {
                    val body = res.body()!!
                    sessionManager.saveAuthToken(body.token)
                    sessionManager.saveUser(
                        body._id,
                        body.name,
                        body.email,
                        body.role,
                        body.assessmentCompleted
                    )
                    _authState.value = AuthState.Success(body)
                } else {
                    _authState.value = AuthState.Error(res.errorBody()?.string() ?: "Registration failed")
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "Network error")
            }
        }
    }

    sealed class AuthState {
        object Loading : AuthState()
        data class Success(val response: AuthResponse) : AuthState()
        data class Error(val message: String) : AuthState()
    }
}
