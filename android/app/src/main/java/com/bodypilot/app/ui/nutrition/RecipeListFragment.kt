package com.bodypilot.app.ui.nutrition

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.RecipeDto
import com.bodypilot.app.databinding.FragmentRecipeListBinding

class RecipeListFragment : Fragment() {

    private var _binding: FragmentRecipeListBinding? = null
    private val binding get() = _binding!!
    private val viewModel: NutritionViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRecipeListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvRecipes.layoutManager = LinearLayoutManager(requireContext())

        viewModel.recipes.observe(viewLifecycleOwner) { recipes ->
            binding.rvRecipes.adapter = RecipeAdapter(recipes) { recipe ->
                findNavController().navigate(R.id.action_recipes_to_detail)
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.loadRecipes()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class RecipeAdapter(
        private val list: List<RecipeDto>,
        private val onClick: (RecipeDto) -> Unit
    ) : RecyclerView.Adapter<RecipeAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvTitle: TextView = view.findViewById(R.id.tv_exercise_title)
            val tvSubtitle: TextView = view.findViewById(R.id.tv_exercise_subtitle)
            val tvDifficulty: TextView = view.findViewById(R.id.tv_exercise_difficulty)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_exercise, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = list[position]
            holder.tvTitle.text = item.name
            holder.tvSubtitle.text = "${item.calories} kcal • ${item.protein}g Protein • ${item.cookTime}m cook"
            holder.tvDifficulty.text = item.difficulty.capitalize()
            holder.itemView.setOnClickListener { onClick(item) }
        }

        override fun getItemCount(): Int = list.size
    }
}
