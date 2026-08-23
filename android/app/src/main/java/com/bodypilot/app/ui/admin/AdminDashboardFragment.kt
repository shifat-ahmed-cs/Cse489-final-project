package com.bodypilot.app.ui.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentAdminDashboardBinding

data class AdminUserItem(
    val name: String,
    val email: String,
    val role: String
)

class AdminDashboardFragment : Fragment() {

    private var _binding: FragmentAdminDashboardBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAdminDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvAdminUsers.layoutManager = LinearLayoutManager(requireContext())
        val dummyUsers = listOf(
            AdminUserItem("Alex Demo", "demo@bodypilot.com", "User"),
            AdminUserItem("Fitness Pro", "creator@bodypilot.com", "Creator (Verified)"),
            AdminUserItem("BodyPilot Admin", "admin@bodypilot.com", "Admin")
        )
        binding.rvAdminUsers.adapter = AdminUserAdapter(dummyUsers)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class AdminUserAdapter(
        private val users: List<AdminUserItem>
    ) : RecyclerView.Adapter<AdminUserAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvName: TextView = view.findViewById(R.id.tv_exercise_title)
            val tvEmail: TextView = view.findViewById(R.id.tv_exercise_subtitle)
            val tvRole: TextView = view.findViewById(R.id.tv_exercise_difficulty)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_exercise, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = users[position]
            holder.tvName.text = item.name
            holder.tvEmail.text = item.email
            holder.tvRole.text = item.role
        }

        override fun getItemCount(): Int = users.size
    }
}
