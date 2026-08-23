package com.bodypilot.app.ui.nutrition

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.MealDto
import com.bodypilot.app.databinding.FragmentMealPlanBinding

class MealPlanFragment : Fragment() {

    private var _binding: FragmentMealPlanBinding? = null
    private val binding get() = _binding!!
    private val viewModel: NutritionViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMealPlanBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvMeals.layoutManager = LinearLayoutManager(requireContext())

        binding.btnRecipes.setOnClickListener {
            findNavController().navigate(R.id.action_nutrition_to_recipes)
        }

        binding.btnGroceryList.setOnClickListener {
            findNavController().navigate(R.id.action_nutrition_to_shoppingList)
        }

        viewModel.mealPlan.observe(viewLifecycleOwner) { plan ->
            if (plan != null) {
                binding.tvCalorieTarget.text = "Target: ${plan.dailyTargets.calories} kcal | ${plan.dailyTargets.protein}g Protein"
                val pct = if (plan.dailyTargets.calories > 0) (plan.dailyActuals.calories * 100) / plan.dailyTargets.calories else 0
                binding.macroProgress.progress = pct

                binding.rvMeals.adapter = MealAdapter(plan.meals) { meal ->
                    findNavController().navigate(R.id.action_nutrition_to_substitution)
                }
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.loadMealPlan()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class MealAdapter(
        private val meals: List<MealDto>,
        private val onSwapClick: (MealDto) -> Unit
    ) : RecyclerView.Adapter<MealAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvMealType: TextView = view.findViewById(R.id.tv_meal_type)
            val tvCalories: TextView = view.findViewById(R.id.tv_meal_calories)
            val tvFoodsPreview: TextView = view.findViewById(R.id.tv_meal_foods_preview)
            val btnSwap: Button = view.findViewById(R.id.btn_substitute_meal)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_meal, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = meals[position]
            holder.tvMealType.text = item.mealType.replace('_', ' ').capitalize()
            holder.tvCalories.text = "${item.totalCalories} kcal • ${item.totalProtein}g P"
            holder.tvFoodsPreview.text = item.foods.joinToString("\n") { "• ${it.foodName} (${it.servingSize.toInt()}${it.servingUnit}) - ${it.calories} cal" }

            holder.btnSwap.setOnClickListener { onSwapClick(item) }
        }

        override fun getItemCount(): Int = meals.size
    }
}
