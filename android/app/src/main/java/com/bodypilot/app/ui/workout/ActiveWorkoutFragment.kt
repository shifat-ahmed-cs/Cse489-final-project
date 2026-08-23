package com.bodypilot.app.ui.workout

import android.os.Bundle
import android.os.CountDownTimer
import android.os.SystemClock
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.WorkoutExerciseDto
import com.bodypilot.app.databinding.FragmentActiveWorkoutBinding

class ActiveWorkoutFragment : Fragment() {

    private var _binding: FragmentActiveWorkoutBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WorkoutViewModel by viewModels()

    private var restTimer: CountDownTimer? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentActiveWorkoutBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.chronometer.base = SystemClock.elapsedRealtime()
        binding.chronometer.start()

        binding.rvActiveExercises.layoutManager = LinearLayoutManager(requireContext())

        binding.btnFinishWorkout.setOnClickListener {
            binding.chronometer.stop()
            findNavController().navigate(R.id.action_active_to_feedback)
        }

        viewModel.plan.observe(viewLifecycleOwner) { plan ->
            if (plan != null) {
                val today = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1
                val workoutDay = plan.schedule.find { it.dayOfWeek == today } ?: plan.schedule.firstOrNull { !it.isRestDay }

                if (workoutDay != null) {
                    binding.tvActiveWorkoutTitle.text = workoutDay.title
                    binding.tvExerciseProgress.text = "${workoutDay.exercises.size} Exercises to Complete"

                    binding.rvActiveExercises.adapter = ActiveExerciseAdapter(workoutDay.exercises) { restSeconds ->
                        startRestTimer(restSeconds)
                    }
                }
            }
        }

        viewModel.fetchPlan()
    }

    private fun startRestTimer(seconds: Int) {
        restTimer?.cancel()
        binding.layoutRestTimer.visibility = View.VISIBLE

        restTimer = object : CountDownTimer(seconds * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                if (_binding != null) {
                    val sec = millisUntilFinished / 1000
                    binding.tvRestTimer.text = "Rest: 00:${if (sec < 10) "0$sec" else sec} • Catch your breath!"
                }
            }

            override fun onFinish() {
                if (_binding != null) {
                    binding.layoutRestTimer.visibility = View.GONE
                }
            }
        }.start()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        restTimer?.cancel()
        _binding = null
    }

    class ActiveExerciseAdapter(
        private val exercises: List<WorkoutExerciseDto>,
        private val onSetCompleted: (Int) -> Unit
    ) : RecyclerView.Adapter<ActiveExerciseAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvTitle: TextView = view.findViewById(R.id.tv_exercise_title)
            val tvSubtitle: TextView = view.findViewById(R.id.tv_exercise_subtitle)
            val cbComplete: TextView = view.findViewById(R.id.tv_exercise_difficulty)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_exercise, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = exercises[position]
            holder.tvTitle.text = item.exerciseName
            holder.tvSubtitle.text = "${item.sets} sets × ${item.reps} (${item.restPeriod}s rest)"
            holder.cbComplete.text = if (item.completed) "Done ✓" else "Complete"

            holder.itemView.setOnClickListener {
                item.completed = !item.completed
                holder.cbComplete.text = if (item.completed) "Done ✓" else "Complete"
                if (item.completed) {
                    onSetCompleted(item.restPeriod)
                }
            }
        }

        override fun getItemCount(): Int = exercises.size
    }
}
