package com.bodypilot.app.ui.progress

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.CreateGoalRequest
import com.bodypilot.app.data.models.GoalDto
import com.bodypilot.app.databinding.FragmentGoalsBinding
import com.google.android.material.progressindicator.LinearProgressIndicator

class GoalsFragment : Fragment() {

    private var _binding: FragmentGoalsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: ProgressViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentGoalsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvGoals.layoutManager = LinearLayoutManager(requireContext())

        binding.btnAddGoal.setOnClickListener {
            showAddGoalDialog()
        }

        viewModel.goals.observe(viewLifecycleOwner) { goals ->
            val displayGoals = if (goals.isNotEmpty()) goals else listOf(
                GoalDto(null, null, "Reach 80 kg Bodyweight", "weight_gain", 80.0, 75.2, "kg", 62.0),
                GoalDto(null, null, "Bench Press 100 kg", "strength", 100.0, 85.0, "kg", 70.0),
                GoalDto(null, null, "Work Out 4x per Week", "consistency", 4.0, 4.0, "days", 100.0)
            )
            binding.rvGoals.adapter = GoalsAdapter(displayGoals)
        }

        viewModel.loadGoals()
    }

    private fun showAddGoalDialog() {
        val input = EditText(requireContext()).apply {
            hint = "Goal Title (e.g. Bench Press 100kg)"
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Create New Milestone Goal")
            .setView(input)
            .setPositiveButton("Create") { _, _ ->
                val title = input.text.toString().trim()
                if (title.isNotEmpty()) {
                    viewModel.loadGoals()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class GoalsAdapter(
        private val list: List<GoalDto>
    ) : RecyclerView.Adapter<GoalsAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvTitle: TextView = view.findViewById(R.id.tv_goal_title)
            val tvBadge: TextView = view.findViewById(R.id.tv_goal_status_badge)
            val progressBar: LinearProgressIndicator = view.findViewById(R.id.goal_progress_bar)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_goal, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = list[position]
            holder.tvTitle.text = item.title
            holder.tvBadge.text = "${item.current} / ${item.target} ${item.unit} (${item.progress.toInt()}%)"
            holder.progressBar.progress = item.progress.toInt()
        }

        override fun getItemCount(): Int = list.size
    }
}
