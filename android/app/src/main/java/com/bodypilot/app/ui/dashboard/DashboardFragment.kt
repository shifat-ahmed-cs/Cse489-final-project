package com.bodypilot.app.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentDashboardBinding
import com.bodypilot.app.ui.adapt.AdaptPlanDialogFragment
import com.bodypilot.app.utils.SessionManager

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val session = SessionManager(requireContext())
        binding.tvGreeting.text = "Welcome back, ${session.getUserName()} 👋"

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadDashboardData()
        }

        binding.btnStartWorkout.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_activeWorkout)
        }

        binding.btnViewMealPlan.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_mealPlan)
        }

        binding.btnLogFood.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_foodLog)
        }

        binding.cardAdaptPlan.setOnClickListener {
            val dialog = AdaptPlanDialogFragment()
            dialog.show(parentFragmentManager, "AdaptPlanDialog")
        }

        binding.btnNavCommunity.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_community)
        }

        binding.btnNavCreators.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_creators)
        }

        binding.btnNavSettings.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_settings)
        }

        binding.btnNavAdmin.setOnClickListener {
            findNavController().navigate(R.id.action_dashboard_to_admin)
        }

        viewModel.workoutPlan.observe(viewLifecycleOwner) { plan ->
            if (plan != null) {
                val today = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1
                val todayWorkout = plan.schedule.find { it.dayOfWeek == today } ?: plan.schedule.firstOrNull()

                if (todayWorkout != null && !todayWorkout.isRestDay) {
                    binding.tvWorkoutTitle.text = todayWorkout.title
                    binding.tvWorkoutDuration.text = "${todayWorkout.duration} mins • ${todayWorkout.exercises.size} exercises"
                    binding.tvWorkoutSubtitle.text = todayWorkout.exercises.take(4).joinToString(", ") { it.exerciseName }
                    binding.btnStartWorkout.isEnabled = true
                    binding.btnStartWorkout.text = getString(R.string.btn_start_workout)
                } else {
                    binding.tvWorkoutTitle.text = "Rest & Recovery Day 😴"
                    binding.tvWorkoutDuration.text = "Active Recovery"
                    binding.tvWorkoutSubtitle.text = "Hydrate, stretch, and let muscles rebuild."
                    binding.btnStartWorkout.text = "Log Mobility Session"
                }
            }
        }

        viewModel.mealPlan.observe(viewLifecycleOwner) { mealPlan ->
            if (mealPlan != null) {
                val targets = mealPlan.dailyTargets
                val actuals = mealPlan.dailyActuals

                binding.tvCaloriesSummary.text = "${actuals.calories} / ${targets.calories} kcal"
                binding.calorieProgress.max = targets.calories
                binding.calorieProgress.progress = actuals.calories

                binding.tvProteinVal.text = "${actuals.protein} / ${targets.protein}g"
                binding.tvCarbsVal.text = "${actuals.carbs} / ${targets.carbs}g"
                binding.tvFatVal.text = "${actuals.fat} / ${targets.fat}g"
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.swipeRefresh.isRefreshing = loading
        }

        viewModel.loadDashboardData()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
