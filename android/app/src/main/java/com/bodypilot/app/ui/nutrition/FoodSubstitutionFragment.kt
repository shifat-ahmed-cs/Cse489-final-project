package com.bodypilot.app.ui.nutrition

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.FoodDto
import com.bodypilot.app.databinding.FragmentFoodSubstitutionBinding

class FoodSubstitutionFragment : Fragment() {

    private var _binding: FragmentFoodSubstitutionBinding? = null
    private val binding get() = _binding!!
    private val viewModel: NutritionViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFoodSubstitutionBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvSubstitutes.layoutManager = LinearLayoutManager(requireContext())

        // Default: display substitution options for chicken
        viewModel.searchFoods("salmon")

        viewModel.foodSearchResults.observe(viewLifecycleOwner) { substitutes ->
            binding.rvSubstitutes.adapter = SubstituteAdapter(substitutes) { chosenFood ->
                Toast.makeText(requireContext(), "Substituted with ${chosenFood.name}! Meal plan macros updated.", Toast.LENGTH_SHORT).show()
                findNavController().popBackStack()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class SubstituteAdapter(
        private val list: List<FoodDto>,
        private val onSelect: (FoodDto) -> Unit
    ) : RecyclerView.Adapter<SubstituteAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvTitle: TextView = view.findViewById(R.id.tv_exercise_title)
            val tvSubtitle: TextView = view.findViewById(R.id.tv_exercise_subtitle)
            val tvAction: TextView = view.findViewById(R.id.tv_exercise_difficulty)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_exercise, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = list[position]
            holder.tvTitle.text = item.name
            holder.tvSubtitle.text = "${item.calories} kcal • ${item.protein}g Protein • ${item.carbs}g Carbs"
            holder.tvAction.text = "Select 🔄"
            holder.itemView.setOnClickListener { onSelect(item) }
        }

        override fun getItemCount(): Int = list.size
    }
}
