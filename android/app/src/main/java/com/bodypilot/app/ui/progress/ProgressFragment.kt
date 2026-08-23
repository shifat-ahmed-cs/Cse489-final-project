package com.bodypilot.app.ui.progress

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentProgressBinding
import com.github.mikephil.charting.data.*

class ProgressFragment : Fragment() {

    private var _binding: FragmentProgressBinding? = null
    private val binding get() = _binding!!
    private val viewModel: ProgressViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProgressBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnGoals.setOnClickListener {
            findNavController().navigate(R.id.action_progress_to_goals)
        }

        binding.btnLogWeight.setOnClickListener {
            showLogWeightDialog()
        }

        setupCharts()

        viewModel.dashboard.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                if (data.weight != null) {
                    binding.tvCurrentWeight.text = "${data.weight.currentWeight ?: 75.0} kg"
                    binding.tvCurrentBmi.text = "23.4"
                    updateWeightChart(data.weight.entries)
                }

                if (data.workout != null) {
                    binding.tvConsistency.text = "${data.workout.avgCompletion.toInt()}%"
                }
            }
        }

        viewModel.loadDashboard()
    }

    private fun setupCharts() {
        // Line chart styling
        binding.chartWeight.apply {
            description.isEnabled = false
            setTouchEnabled(true)
            isDragEnabled = true
            setScaleEnabled(true)
            setPinchZoom(true)
            setDrawGridBackground(false)
            xAxis.textColor = Color.parseColor("#94A3B8")
            axisLeft.textColor = Color.parseColor("#94A3B8")
            axisRight.isEnabled = false
            legend.textColor = Color.parseColor("#F8FAFC")
        }

        // Bar chart styling
        binding.chartVolume.apply {
            description.isEnabled = false
            xAxis.textColor = Color.parseColor("#94A3B8")
            axisLeft.textColor = Color.parseColor("#94A3B8")
            axisRight.isEnabled = false
            legend.textColor = Color.parseColor("#F8FAFC")

            val barEntries = listOf(
                BarEntry(1f, 2400f),
                BarEntry(2f, 2800f),
                BarEntry(3f, 3100f),
                BarEntry(4f, 3400f)
            )
            val barDataSet = BarDataSet(barEntries, "Weekly Volume (kg)").apply {
                color = Color.parseColor("#6366F1")
                valueTextColor = Color.WHITE
            }
            data = BarData(barDataSet)
            invalidate()
        }
    }

    private fun updateWeightChart(entries: List<com.bodypilot.app.data.models.WeightEntryDto>) {
        val lineEntries = if (entries.isNotEmpty()) {
            entries.mapIndexed { idx, e -> Entry(idx.toFloat(), e.weight.toFloat()) }
        } else {
            listOf(Entry(0f, 76.5f), Entry(1f, 76.0f), Entry(2f, 75.5f), Entry(3f, 75.2f))
        }

        val dataSet = LineDataSet(lineEntries, "Bodyweight (kg)").apply {
            color = Color.parseColor("#06B6D4")
            setCircleColor(Color.parseColor("#6366F1"))
            lineWidth = 2.5f
            circleRadius = 4f
            valueTextColor = Color.WHITE
            setDrawFilled(true)
            fillColor = Color.parseColor("#1E1B4B")
        }

        binding.chartWeight.data = LineData(dataSet)
        binding.chartWeight.invalidate()
    }

    private fun showLogWeightDialog() {
        val input = EditText(requireContext()).apply {
            hint = "Enter weight in kg (e.g. 75.2)"
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Log Today's Weight")
            .setView(input)
            .setPositiveButton("Save") { _, _ ->
                val w = input.text.toString().toDoubleOrNull()
                if (w != null) {
                    viewModel.logWeight(w)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
