package com.bodypilot.app.ui.nutrition

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.bodypilot.app.databinding.FragmentFoodLogBinding

class FoodLogFragment : Fragment() {

    private var _binding: FragmentFoodLogBinding? = null
    private val binding get() = _binding!!
    private val viewModel: NutritionViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFoodLogBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnWater250.setOnClickListener {
            viewModel.logWater(250)
            Toast.makeText(requireContext(), "+250 ml Water Tracked 💧", Toast.LENGTH_SHORT).show()
        }

        binding.btnWater500.setOnClickListener {
            viewModel.logWater(500)
            Toast.makeText(requireContext(), "+500 ml Water Tracked 💧", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
