package com.bodypilot.app.ui.community

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.ChallengeDto
import com.bodypilot.app.data.models.CommunityPostDto
import com.bodypilot.app.data.repository.CommunityRepository
import kotlinx.coroutines.launch

class CommunityViewModel : ViewModel() {
    private val repo = CommunityRepository()

    private val _posts = MutableLiveData<List<CommunityPostDto>>()
    val posts: LiveData<List<CommunityPostDto>> = _posts

    private val _challenges = MutableLiveData<List<ChallengeDto>>()
    val challenges: LiveData<List<ChallengeDto>> = _challenges

    fun loadFeed() {
        viewModelScope.launch {
            try {
                val res = repo.getFeed()
                if (res.isSuccessful) {
                    _posts.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun createPost(content: String) {
        viewModelScope.launch {
            try {
                val res = repo.createPost(content)
                if (res.isSuccessful) {
                    loadFeed()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun loadChallenges() {
        viewModelScope.launch {
            try {
                val res = repo.getChallenges()
                if (res.isSuccessful) {
                    _challenges.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }
}
