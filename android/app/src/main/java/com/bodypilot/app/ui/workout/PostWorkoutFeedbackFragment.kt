package com.bodypilot.app.ui.workout

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.data.models.WorkoutFeedbackDto
import com.bodypilot.app.databinding.FragmentPostWorkoutFeedbackBinding

class PostWorkoutFeedbackFragment : Fragment() {

    private var _binding: FragmentPostWorkoutFeedbackBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WorkoutViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPostWorkoutFeedbackBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.cbPainDiscomfort.setOnCheckedChangeListener { _, isChecked ->
            binding.tilPainArea.visibility = if (isChecked) View.VISIBLE else View.GONE
        }

        binding.btnSubmitFeedback.setOnClickListener {
            val difficulty = when (binding.chipGroupDifficulty.checkedChipId) {
                R.id.chip_very_easy -> "very_easy"
                R.id.chip_easy -> "easy"
                R.id.chip_hard -> "hard"
                R.id.chip_very_hard -> "very_hard"
                else -> "moderate"
            }

            val hasPain = binding.cbPainDiscomfort.isChecked
            val painArea = binding.etPainArea.text.toString().trim()
            val painAreas = if (hasPain && painArea.isNotEmpty()) listOf(painArea) else emptyList()
            val notes = binding.etNotes.text.toString().trim()

            viewModel.logWorkout(
                dayTitle = "Completed Session",
                workoutType = "workout",
                duration = 45,
                feedback = WorkoutFeedbackDto(
                    overallDifficulty = difficulty,
                    painOrDiscomfort = hasPain,
                    painAreas = painAreas,
                    notes = notes
                )
            )

            // If user reported injury, automatically trigger adaptation!
            if (hasPain && painArea.isNotEmpty()) {
                viewModel.adaptPlan(action = "injury", injuryArea = painArea)
                Toast.makeText(requireContext(), "Feedback saved & workout plan recalibrated for your $painArea!", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(requireContext(), "Great job! Workout logged successfully.", Toast.LENGTH_SHORT).show()
            }

            findNavController().popBackStack(R.id.nav_workout, false)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
