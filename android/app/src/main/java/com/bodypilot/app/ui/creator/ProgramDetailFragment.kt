package com.bodypilot.app.ui.creator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentProgramDetailBinding

class ProgramDetailFragment : Fragment() {

    private var _binding: FragmentProgramDetailBinding? = null
    private val binding get() = _binding!!
    private val viewModel: CreatorViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProgramDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnFollowProgram.setOnClickListener {
            Toast.makeText(requireContext(), "Program followed! Setting as your active workout schedule...", Toast.LENGTH_SHORT).show()
            findNavController().navigate(R.id.nav_workout)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
