package com.bodypilot.app.ui.assistant

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.SuggestionDto
import com.bodypilot.app.data.repository.AssistantRepository
import kotlinx.coroutines.launch

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

class AssistantViewModel : ViewModel() {
    private val repo = AssistantRepository()

    private val _messages = MutableLiveData<MutableList<ChatMessage>>(mutableListOf())
    val messages: LiveData<MutableList<ChatMessage>> = _messages

    private val _suggestions = MutableLiveData<List<SuggestionDto>>()
    val suggestions: LiveData<List<SuggestionDto>> = _suggestions

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    init {
        // Initial welcoming coach greeting
        _messages.value?.add(
            ChatMessage(
                text = "Hey! 👋 I'm your BodyPilot AI Coach. Ask me about today's workout, meal suggestions, adapting for injuries, or progress updates!",
                isUser = false
            )
        )
        loadSuggestions()
    }

    fun loadSuggestions() {
        viewModelScope.launch {
            try {
                val res = repo.getSuggestions()
                if (res.isSuccessful) {
                    _suggestions.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun sendMessage(text: String) {
        val currentList = _messages.value ?: mutableListOf()
        currentList.add(ChatMessage(text = text, isUser = true))
        _messages.value = currentList
        _isLoading.value = true

        viewModelScope.launch {
            try {
                val res = repo.chat(text)
                if (res.isSuccessful && res.body() != null) {
                    val reply = res.body()!!.response
                    currentList.add(ChatMessage(text = reply, isUser = false))
                } else {
                    currentList.add(ChatMessage(text = "I couldn't process that right now. Please try again!", isUser = false))
                }
            } catch (e: Exception) {
                currentList.add(ChatMessage(text = "Connection error. Please ensure the backend is running.", isUser = false))
            } finally {
                _isLoading.value = false
                _messages.value = currentList
            }
        }
    }
}
