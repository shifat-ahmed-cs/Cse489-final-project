package com.bodypilot.app.ui.workout

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
import com.bodypilot.app.data.models.WorkoutDayDto
import com.bodypilot.app.databinding.FragmentWorkoutPlanBinding

class WorkoutPlanFragment : Fragment() {

    private var _binding: FragmentWorkoutPlanBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WorkoutViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWorkoutPlanBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvWorkoutDays.layoutManager = LinearLayoutManager(requireContext())

        binding.btnExerciseLibrary.setOnClickListener {
            findNavController().navigate(R.id.action_workout_to_library)
        }

        binding.btnQuickWorkout.setOnClickListener {
            findNavController().navigate(R.id.action_workout_to_active)
        }

        viewModel.plan.observe(viewLifecycleOwner) { plan ->
            if (plan != null) {
                binding.tvPlanName.text = plan.name
                binding.tvPlanSplit.text = "${plan.splitType?.replace('_', '/')?.uppercase()} • Week ${plan.weekNumber}"
                binding.rvWorkoutDays.adapter = WorkoutDaysAdapter(plan.schedule) { day ->
                    if (!day.isRestDay) {
                        findNavController().navigate(R.id.action_workout_to_active)
                    }
                }
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.fetchPlan()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class WorkoutDaysAdapter(
        private val days: List<WorkoutDayDto>,
        private val onItemClick: (WorkoutDayDto) -> Unit
    ) : RecyclerView.Adapter<WorkoutDaysAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvDayName: TextView = view.findViewById(R.id.tv_day_name)
            val tvDayTitle: TextView = view.findViewById(R.id.tv_day_title)
            val tvDayDuration: TextView = view.findViewById(R.id.tv_day_duration)
            val tvExercisesPreview: TextView = view.findViewById(R.id.tv_day_exercises_preview)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_workout_day, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = days[position]
            holder.tvDayName.text = item.dayName
            holder.tvDayTitle.text = item.title
            holder.tvDayDuration.text = if (item.isRestDay) "Rest" else "${item.duration} min"
            holder.tvExercisesPreview.text = if (item.isRestDay) {
                "Rest and recovery day"
            } else {
                item.exercises.joinToString(", ") { it.exerciseName }
            }

            holder.itemView.setOnClickListener { onItemClick(item) }
        }

        override fun getItemCount(): Int = days.size
    }
}
