package com.bodypilot.app.ui.creator

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
import com.bodypilot.app.data.models.CreatorDto
import com.bodypilot.app.databinding.FragmentCreatorBrowseBinding

class CreatorBrowseFragment : Fragment() {

    private var _binding: FragmentCreatorBrowseBinding? = null
    private val binding get() = _binding!!
    private val viewModel: CreatorViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreatorBrowseBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvCreators.layoutManager = LinearLayoutManager(requireContext())

        viewModel.creators.observe(viewLifecycleOwner) { creators ->
            val displayList = if (creators.isNotEmpty()) creators else listOf(
                CreatorDto("1", com.bodypilot.app.data.models.CreatorUserDto("1", "Coach Sarah", null), "Strength & Hypertrophy Coach with 7+ years training athletes.", listOf("Hypertrophy", "Strength"), true, 4.9, 1250),
                CreatorDto("2", com.bodypilot.app.data.models.CreatorUserDto("2", "Marcus 'Apex' Vance", "Specialist in Calisthenics and Athletic Performance.", listOf("Calisthenics", "Mobility"), true, 4.8, 890)
            )
            binding.rvCreators.adapter = CreatorAdapter(displayList) {
                findNavController().navigate(R.id.action_creators_to_program)
            }
        }

        viewModel.loadCreators()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class CreatorAdapter(
        private val list: List<CreatorDto>,
        private val onClick: (CreatorDto) -> Unit
    ) : RecyclerView.Adapter<CreatorAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvName: TextView = view.findViewById(R.id.tv_creator_name)
            val tvRating: TextView = view.findViewById(R.id.tv_creator_rating)
            val tvBio: TextView = view.findViewById(R.id.tv_creator_bio)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_creator, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = list[position]
            holder.tvName.text = "${item.userId?.name ?: "Fitness Coach"} ${if (item.isVerified) "✓" else ""}"
            holder.tvRating.text = "⭐ ${item.rating} (${item.followerCount} followers)"
            holder.tvBio.text = item.bio ?: "Certified trainer sharing custom workout routines."
            holder.itemView.setOnClickListener { onClick(item) }
        }

        override fun getItemCount(): Int = list.size
    }
}
