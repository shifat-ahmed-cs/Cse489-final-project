package com.bodypilot.app.ui.community

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
import com.bodypilot.app.data.models.CommunityPostDto
import com.bodypilot.app.databinding.FragmentCommunityFeedBinding

class CommunityFeedFragment : Fragment() {

    private var _binding: FragmentCommunityFeedBinding? = null
    private val binding get() = _binding!!
    private val viewModel: CommunityViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCommunityFeedBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvPosts.layoutManager = LinearLayoutManager(requireContext())

        binding.btnNewPost.setOnClickListener {
            showCreatePostDialog()
        }

        viewModel.posts.observe(viewLifecycleOwner) { posts ->
            val displayList = if (posts.isNotEmpty()) posts else listOf(
                CommunityPostDto("1", com.bodypilot.app.data.models.CreatorUserDto("1", "David Kim", null), "achievement", "Hit a new PR today: 120 kg Squat! The adaptive overload engine really works 🚀", 32, 7, "1h ago"),
                CommunityPostDto("2", com.bodypilot.app.data.models.CreatorUserDto("2", "Elena Rostova", null), "workout", "Completed Day 14 of the Strength Challenge. Sore but motivated!", 19, 4, "3h ago"),
                CommunityPostDto("3", com.bodypilot.app.data.models.CreatorUserDto("3", "Alex Demo", null), "general", "Swapped chicken for salmon in my dinner meal plan and macros balanced automatically. Love this app!", 28, 2, "5h ago")
            )
            binding.rvPosts.adapter = PostsAdapter(displayList)
        }

        viewModel.loadFeed()
    }

    private fun showCreatePostDialog() {
        val input = EditText(requireContext()).apply {
            hint = "Share your fitness milestone or achievement..."
        }

        AlertDialog.Builder(requireContext())
            .setTitle("New Community Post")
            .setView(input)
            .setPositiveButton("Post") { _, _ ->
                val content = input.text.toString().trim()
                if (content.isNotEmpty()) {
                    viewModel.createPost(content)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class PostsAdapter(
        private val list: List<CommunityPostDto>
    ) : RecyclerView.Adapter<PostsAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvAuthor: TextView = view.findViewById(R.id.tv_post_author)
            val tvTime: TextView = view.findViewById(R.id.tv_post_time)
            val tvContent: TextView = view.findViewById(R.id.tv_post_content)
            val tvLikes: TextView = view.findViewById(R.id.tv_likes_count)
            val tvComments: TextView = view.findViewById(R.id.tv_comments_count)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_community_post, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = list[position]
            holder.tvAuthor.text = item.userId?.name ?: "Athlete"
            holder.tvTime.text = item.createdAt ?: "Recent"
            holder.tvContent.text = item.content
            holder.tvLikes.text = "❤️ ${item.likeCount} Likes"
            holder.tvComments.text = "💬 ${item.commentCount} Comments"
        }

        override fun getItemCount(): Int = list.size
    }
}
