package com.bodypilot.app.ui.onboarding

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.bodypilot.app.R
import com.bodypilot.app.data.models.InjuryItem
import com.bodypilot.app.databinding.FragmentOnboardingBinding
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup

class OnboardingFragment : Fragment() {

    private var _binding: FragmentOnboardingBinding? = null
    private val binding get() = _binding!!
    private val viewModel: AssessmentViewModel by viewModels()

    private var currentStep = 1

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentOnboardingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        renderStep(currentStep)

        binding.btnNextStep.setOnClickListener {
            if (currentStep < 5) {
                saveCurrentStepData(currentStep)
                currentStep++
                renderStep(currentStep)
            } else {
                saveCurrentStepData(currentStep)
                viewModel.finishAssessment()
            }
        }

        binding.btnPrevStep.setOnClickListener {
            if (currentStep > 1) {
                currentStep--
                renderStep(currentStep)
            }
        }

        viewModel.submitState.observe(viewLifecycleOwner) { state ->
            when (state) {
                is AssessmentViewModel.SubmitState.Loading -> {
                    binding.btnNextStep.isEnabled = false
                    binding.btnNextStep.text = "Generating Personalized Plans..."
                }
                is AssessmentViewModel.SubmitState.Success -> {
                    findNavController().navigate(R.id.action_onboarding_to_dashboard)
                }
                is AssessmentViewModel.SubmitState.Error -> {
                    binding.btnNextStep.isEnabled = true
                    binding.btnNextStep.text = getString(R.string.btn_finish)
                    Toast.makeText(requireContext(), state.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun renderStep(step: Int) {
        binding.stepProgress.progress = step
        binding.btnPrevStep.visibility = if (step > 1) View.VISIBLE else View.GONE
        binding.btnNextStep.text = if (step == 5) getString(R.string.btn_finish) else getString(R.string.btn_next)

        binding.stepContainer.removeAllViews()

        when (step) {
            1 -> renderStep1Goal()
            2 -> renderStep2Body()
            3 -> renderStep3Workout()
            4 -> renderStep4Injuries()
            5 -> renderStep5Nutrition()
        }
    }

    private fun renderStep1Goal() {
        binding.tvStepIndicator.text = "Step 1 of 5: Primary Fitness Goal"

        val label = TextView(requireContext()).apply {
            text = "What is your main fitness objective?"
            textSize = 16f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(label)

        val radioGroup = RadioGroup(requireContext()).apply { id = R.id.rg_goal; layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT) }
        val goals = listOf(
            "muscle_gain" to "💪 Muscle Gain & Hypertrophy",
            "weight_loss" to "🔥 Weight Loss & Fat Burning",
            "strength" to "🏋️ Maximum Strength",
            "endurance" to "🏃 Cardiovascular Endurance",
            "general_fitness" to "🌟 General Fitness & Longevity",
            "flexibility" to "🧘 Flexibility & Mobility"
        )

        goals.forEachIndexed { idx, (key, title) ->
            val rb = RadioButton(requireContext()).apply {
                text = title
                tag = key
                setTextColor(resources.getColor(R.color.text_secondary, null))
                if (idx == 0) isChecked = true
            }
            radioGroup.addView(rb)
        }
        binding.stepContainer.addView(radioGroup)

        // Fitness Level
        val levelLabel = TextView(requireContext()).apply {
            text = "\nWhat is your current fitness level?"
            textSize = 16f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(levelLabel)

        val levelGroup = RadioGroup(requireContext()).apply { id = R.id.rg_level }
        listOf("beginner" to "Beginner (0-6 months)", "intermediate" to "Intermediate (1-2 years)", "advanced" to "Advanced (3+ years)").forEachIndexed { idx, (k, t) ->
            val rb = RadioButton(requireContext()).apply {
                text = t
                tag = k
                setTextColor(resources.getColor(R.color.text_secondary, null))
                if (idx == 0) isChecked = true
            }
            levelGroup.addView(rb)
        }
        binding.stepContainer.addView(levelGroup)
    }

    private fun renderStep2Body() {
        binding.tvStepIndicator.text = "Step 2 of 5: Body Assessment"

        val tv = TextView(requireContext()).apply {
            text = "Tell us about your body metrics:"
            textSize = 16f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(tv)

        val etHeight = EditText(requireContext()).apply {
            id = R.id.et_height
            hint = "Height in cm (e.g. 175)"
            setText("175")
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            setTextColor(resources.getColor(R.color.text_primary, null))
            setHintTextColor(resources.getColor(R.color.text_muted, null))
        }
        binding.stepContainer.addView(etHeight)

        val etWeight = EditText(requireContext()).apply {
            id = R.id.et_weight
            hint = "Current Weight in kg (e.g. 75)"
            setText("75")
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
            setTextColor(resources.getColor(R.color.text_primary, null))
            setHintTextColor(resources.getColor(R.color.text_muted, null))
        }
        binding.stepContainer.addView(etWeight)

        val etAge = EditText(requireContext()).apply {
            id = R.id.et_age
            hint = "Age (e.g. 25)"
            setText("25")
            inputType = android.text.InputType.TYPE_CLASS_NUMBER
            setTextColor(resources.getColor(R.color.text_primary, null))
            setHintTextColor(resources.getColor(R.color.text_muted, null))
        }
        binding.stepContainer.addView(etAge)
    }

    private fun renderStep3Workout() {
        binding.tvStepIndicator.text = "Step 3 of 5: Workout Preferences"

        val tvDays = TextView(requireContext()).apply {
            text = "How many days can you work out per week?"
            textSize = 15f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(tvDays)

        val rgDays = RadioGroup(requireContext()).apply { id = R.id.rg_days; orientation = RadioGroup.HORIZONTAL }
        listOf(2, 3, 4, 5, 6).forEachIndexed { idx, d ->
            val rb = RadioButton(requireContext()).apply {
                text = "$d days"
                tag = d
                setTextColor(resources.getColor(R.color.text_secondary, null))
                if (d == 4) isChecked = true
            }
            rgDays.addView(rb)
        }
        binding.stepContainer.addView(rgDays)

        val tvLoc = TextView(requireContext()).apply {
            text = "\nPreferred Workout Location & Equipment:"
            textSize = 15f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(tvLoc)

        val rgLoc = RadioGroup(requireContext()).apply { id = R.id.rg_loc }
        listOf("gym" to "Commercial Gym (Full Equipment)", "home" to "Home Workout (Dumbbells/Bodyweight)", "outdoors" to "Outdoors / Running").forEachIndexed { idx, (k, t) ->
            val rb = RadioButton(requireContext()).apply {
                text = t
                tag = k
                setTextColor(resources.getColor(R.color.text_secondary, null))
                if (idx == 0) isChecked = true
            }
            rgLoc.addView(rb)
        }
        binding.stepContainer.addView(rgLoc)
    }

    private fun renderStep4Injuries() {
        binding.tvStepIndicator.text = "Step 4 of 5: Safety & Physical Limitations"

        val tv = TextView(requireContext()).apply {
            text = "Do you have any current or previous injuries?\n(BodyPilot will automatically avoid conflicting exercises):"
            textSize = 14f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(tv)

        val cbKnee = CheckBox(requireContext()).apply { id = R.id.cb_knee; text = "Knee pain / injury (e.g. avoid heavy squats)"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbShoulder = CheckBox(requireContext()).apply { id = R.id.cb_shoulder; text = "Shoulder pain / rotator cuff"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbBack = CheckBox(requireContext()).apply { id = R.id.cb_back; text = "Lower back discomfort"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbWrist = CheckBox(requireContext()).apply { id = R.id.cb_wrist; text = "Wrist pain"; setTextColor(resources.getColor(R.color.text_secondary, null)) }

        binding.stepContainer.addView(cbKnee)
        binding.stepContainer.addView(cbShoulder)
        binding.stepContainer.addView(cbBack)
        binding.stepContainer.addView(cbWrist)
    }

    private fun renderStep5Nutrition() {
        binding.tvStepIndicator.text = "Step 5 of 5: Food Preferences & Allergies"

        val tv = TextView(requireContext()).apply {
            text = "Dietary Restrictions & Allergies:"
            textSize = 15f
            setTextColor(resources.getColor(R.color.text_primary, null))
        }
        binding.stepContainer.addView(tv)

        val cbHalal = CheckBox(requireContext()).apply { id = R.id.cb_halal; text = "Halal"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbVegetarian = CheckBox(requireContext()).apply { id = R.id.cb_vegetarian; text = "Vegetarian"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbDairy = CheckBox(requireContext()).apply { id = R.id.cb_dairy; text = "Lactose Intolerant / No Dairy"; setTextColor(resources.getColor(R.color.text_secondary, null)) }
        val cbNuts = CheckBox(requireContext()).apply { id = R.id.cb_nuts; text = "Nut Allergy"; setTextColor(resources.getColor(R.color.text_secondary, null)) }

        binding.stepContainer.addView(cbHalal)
        binding.stepContainer.addView(cbVegetarian)
        binding.stepContainer.addView(cbDairy)
        binding.stepContainer.addView(cbNuts)
    }

    private fun saveCurrentStepData(step: Int) {
        when (step) {
            1 -> {
                val rgGoal = binding.stepContainer.findViewById<RadioGroup>(R.id.rg_goal)
                val selectedGoal = rgGoal?.findViewById<RadioButton>(rgGoal.checkedRadioButtonId)?.tag as? String ?: "muscle_gain"
                viewModel.profile.goal = selectedGoal

                val rgLevel = binding.stepContainer.findViewById<RadioGroup>(R.id.rg_level)
                val selectedLevel = rgLevel?.findViewById<RadioButton>(rgLevel.checkedRadioButtonId)?.tag as? String ?: "intermediate"
                viewModel.profile.fitnessLevel = selectedLevel
            }
            2 -> {
                val h = binding.stepContainer.findViewById<EditText>(R.id.et_height)?.text?.toString()?.toDoubleOrNull() ?: 175.0
                val w = binding.stepContainer.findViewById<EditText>(R.id.et_weight)?.text?.toString()?.toDoubleOrNull() ?: 75.0
                val a = binding.stepContainer.findViewById<EditText>(R.id.et_age)?.text?.toString()?.toIntOrNull() ?: 25
                viewModel.profile.height = h
                viewModel.profile.weight = w
                viewModel.profile.age = a
            }
            3 -> {
                val rgDays = binding.stepContainer.findViewById<RadioGroup>(R.id.rg_days)
                val days = rgDays?.findViewById<RadioButton>(rgDays.checkedRadioButtonId)?.tag as? Int ?: 4
                viewModel.profile.workoutDaysPerWeek = days

                val rgLoc = binding.stepContainer.findViewById<RadioGroup>(R.id.rg_loc)
                val loc = rgLoc?.findViewById<RadioButton>(rgLoc.checkedRadioButtonId)?.tag as? String ?: "gym"
                viewModel.profile.workoutLocation = loc
            }
            4 -> {
                viewModel.injuries.clear()
                if (binding.stepContainer.findViewById<CheckBox>(R.id.cb_knee)?.isChecked == true) {
                    viewModel.injuries.add(InjuryItem(area = "knee", description = "Knee pain"))
                }
                if (binding.stepContainer.findViewById<CheckBox>(R.id.cb_shoulder)?.isChecked == true) {
                    viewModel.injuries.add(InjuryItem(area = "shoulder", description = "Shoulder pain"))
                }
                if (binding.stepContainer.findViewById<CheckBox>(R.id.cb_back)?.isChecked == true) {
                    viewModel.injuries.add(InjuryItem(area = "lower_back", description = "Lower back discomfort"))
                }
            }
            5 -> {
                viewModel.allergies.clear()
                if (binding.stepContainer.findViewById<CheckBox>(R.id.cb_dairy)?.isChecked == true) viewModel.allergies.add("dairy")
                if (binding.stepContainer.findViewById<CheckBox>(R.id.cb_nuts)?.isChecked == true) viewModel.allergies.add("nuts")
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
