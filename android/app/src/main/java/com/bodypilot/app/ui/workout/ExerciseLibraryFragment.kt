package com.bodypilot.app.ui.workout

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.ExerciseDto
import com.bodypilot.app.databinding.FragmentExerciseLibraryBinding

class ExerciseLibraryFragment : Fragment() {

    private var _binding: FragmentExerciseLibraryBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WorkoutViewModel by viewModels()

    private var selectedCategory: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentExerciseLibraryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvExercises.layoutManager = LinearLayoutManager(requireContext())

        binding.chipGroupCategory.setOnCheckedStateChangeListener { _, checkedIds ->
            selectedCategory = when (checkedIds.firstOrNull()) {
                R.id.chip_cat_chest -> "chest"
                R.id.chip_cat_back -> "back"
                R.id.chip_cat_legs -> "legs"
                R.id.chip_cat_shoulders -> "shoulders"
                R.id.chip_cat_arms -> "arms"
                R.id.chip_cat_core -> "core"
                R.id.chip_cat_cardio -> "cardio"
                else -> null
            }
            viewModel.searchExercises(selectedCategory, binding.etSearchExercise.text.toString())
        }

        binding.etSearchExercise.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                viewModel.searchExercises(selectedCategory, s?.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        viewModel.exercises.observe(viewLifecycleOwner) { exercises ->
            binding.rvExercises.adapter = ExerciseAdapter(exercises) { exercise ->
                // Exercise detail
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.searchExercises(null, null)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class ExerciseAdapter(
        private val list: List<ExerciseDto>,
        private val onClick: (ExerciseDto) -> Unit
    ) : RecyclerView.Adapter<ExerciseAdapter.ViewHolder>() {

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
            holder.tvSubtitle.text = "${item.category.capitalize()} • ${item.equipment.joinToString(", ")}"
            holder.tvDifficulty.text = item.difficulty.capitalize()
            holder.itemView.setOnClickListener { onClick(item) }
        }

        override fun getItemCount(): Int = list.size
    }
}
