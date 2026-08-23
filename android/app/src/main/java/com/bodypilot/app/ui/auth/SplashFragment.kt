package com.bodypilot.app.ui.auth

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentSplashBinding
import com.bodypilot.app.utils.SessionManager

class SplashFragment : Fragment() {

    private var _binding: FragmentSplashBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSplashBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val sessionManager = SessionManager(requireContext())

        Handler(Looper.getMainLooper()).postDelayed({
            if (!isAdded) return@postDelayed

            if (sessionManager.isLoggedIn()) {
                if (sessionManager.isAssessmentCompleted()) {
                    findNavController().navigate(R.id.action_splash_to_dashboard)
                } else {
                    findNavController().navigate(R.id.action_splash_to_onboarding)
                }
            } else {
                findNavController().navigate(R.id.action_splash_to_login)
            }
        }, 1200)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
