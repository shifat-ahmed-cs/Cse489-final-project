package com.bodypilot.app.ui.settings

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentSettingsBinding
import com.bodypilot.app.utils.SessionManager

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val session = SessionManager(requireContext())
        binding.tvProfileName.text = session.getUserName()
        binding.tvProfileEmail.text = session.getUserEmail()
        binding.tvProfileRole.text = "Role: ${session.getUserRole().capitalize()}"

        binding.btnRetakeAssessment.setOnClickListener {
            session.setAssessmentCompleted(false)
            findNavController().navigate(R.id.onboardingFragment)
        }

        binding.btnLogout.setOnClickListener {
            session.clearSession()
            findNavController().navigate(R.id.action_settings_to_login)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
