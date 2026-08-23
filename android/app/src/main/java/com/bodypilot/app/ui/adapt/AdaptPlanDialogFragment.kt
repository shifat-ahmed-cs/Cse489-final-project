package com.bodypilot.app.ui.adapt

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.viewModels
import com.bodypilot.app.R
import com.bodypilot.app.databinding.DialogAdaptPlanBinding
import com.bodypilot.app.ui.workout.WorkoutViewModel
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class AdaptPlanDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogAdaptPlanBinding? = null
    private val binding get() = _binding!!
    private val workoutViewModel: WorkoutViewModel by viewModels({ requireActivity() })

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogAdaptPlanBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rgAdaptReasons.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.rb_injury -> {
                    binding.tilAdaptDetail.visibility = View.VISIBLE
                    binding.tilAdaptDetail.hint = "Specify injured body part (e.g. knee, shoulder, wrist)"
                }
                R.id.rb_less_time -> {
                    binding.tilAdaptDetail.visibility = View.VISIBLE
                    binding.tilAdaptDetail.hint = "Available minutes (e.g. 20 or 30)"
                }
                else -> {
                    binding.tilAdaptDetail.visibility = View.GONE
                }
            }
        }

        binding.btnConfirmAdapt.setOnClickListener {
            val checkedId = binding.rgAdaptReasons.checkedRadioButtonId
            val detail = binding.etAdaptDetail.text.toString().trim()

            when (checkedId) {
                R.id.rb_injury -> {
                    val injury = if (detail.isNotEmpty()) detail else "knee"
                    workoutViewModel.adaptPlan(action = "injury", injuryArea = injury)
                    Toast.makeText(requireContext(), "Recalibrating plan to avoid $injury exercises...", Toast.LENGTH_SHORT).show()
                }
                R.id.rb_less_time -> {
                    val minutes = detail.toIntOrNull() ?: 20
                    workoutViewModel.adaptPlan(action = "time", minutes = minutes)
                    Toast.makeText(requireContext(), "Shortened today's session to $minutes minutes!", Toast.LENGTH_SHORT).show()
                }
                R.id.rb_tired -> {
                    workoutViewModel.adaptPlan(action = "reschedule")
                    Toast.makeText(requireContext(), "Converted today to recovery & shifted schedule!", Toast.LENGTH_SHORT).show()
                }
                R.id.rb_harder -> {
                    workoutViewModel.adaptPlan(action = "difficulty", direction = "harder")
                    Toast.makeText(requireContext(), "Increased sets & intensity across all workouts!", Toast.LENGTH_SHORT).show()
                }
                R.id.rb_missed -> {
                    workoutViewModel.adaptPlan(action = "reschedule")
                    Toast.makeText(requireContext(), "Smart rescheduling applied for missed workout!", Toast.LENGTH_SHORT).show()
                }
            }

            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
