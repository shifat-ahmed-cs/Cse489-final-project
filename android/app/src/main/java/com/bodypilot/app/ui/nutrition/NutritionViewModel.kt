package com.bodypilot.app.ui.nutrition

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bodypilot.app.data.models.*
import com.bodypilot.app.data.repository.NutritionRepository
import kotlinx.coroutines.launch

class NutritionViewModel : ViewModel() {
    private val repo = NutritionRepository()

    private val _mealPlan = MutableLiveData<MealPlanResponse?>()
    val mealPlan: LiveData<MealPlanResponse?> = _mealPlan

    private val _substitutes = MutableLiveData<List<FoodDto>>()
    val substitutes: LiveData<List<FoodDto>> = _substitutes

    private val _recipes = MutableLiveData<List<RecipeDto>>()
    val recipes: LiveData<List<RecipeDto>> = _recipes

    private val _shoppingList = MutableLiveData<List<ShoppingItemDto>>()
    val shoppingList: LiveData<List<ShoppingItemDto>> = _shoppingList

    private val _foodSearchResults = MutableLiveData<List<FoodDto>>()
    val foodSearchResults: LiveData<List<FoodDto>> = _foodSearchResults

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    fun loadMealPlan() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.getMealPlan()
                if (res.isSuccessful) {
                    _mealPlan.value = res.body()
                }
            } catch (e: Exception) {
                // handle
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadSubstituteOptions(foodId: String) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val res = repo.getSubstituteOptions(foodId)
                if (res.isSuccessful) {
                    _substitutes.value = res.body()?.substitutes ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun applySubstitution(mealPlanId: String, mealType: String, oldFoodId: String, newFoodId: String) {
        viewModelScope.launch {
            try {
                val res = repo.substituteFood(mealPlanId, mealType, oldFoodId, newFoodId)
                if (res.isSuccessful) {
                    _mealPlan.value = res.body()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun searchFoods(query: String) {
        viewModelScope.launch {
            try {
                val res = repo.searchFoods(query)
                if (res.isSuccessful) {
                    _foodSearchResults.value = res.body()?.foods ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun loadRecipes() {
        viewModelScope.launch {
            try {
                val res = repo.getRecipes()
                if (res.isSuccessful) {
                    _recipes.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun loadShoppingList() {
        viewModelScope.launch {
            try {
                val res = repo.getShoppingList()
                if (res.isSuccessful) {
                    _shoppingList.value = res.body()?.shoppingList ?: emptyList()
                }
            } catch (e: Exception) {
                // handle
            }
        }
    }

    fun logWater(ml: Int) {
        viewModelScope.launch {
            try {
                repo.logWater(ml)
                loadMealPlan()
            } catch (e: Exception) {
                // handle
            }
        }
    }
}
