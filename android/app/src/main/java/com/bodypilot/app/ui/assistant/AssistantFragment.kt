package com.bodypilot.app.ui.assistant

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.databinding.FragmentAssistantBinding
import com.google.android.material.chip.Chip

class AssistantFragment : Fragment() {

    private var _binding: FragmentAssistantBinding? = null
    private val binding get() = _binding!!
    private val viewModel: AssistantViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAssistantBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val adapter = ChatAdapter(emptyList())
        binding.rvChatMessages.layoutManager = LinearLayoutManager(requireContext()).apply {
            stackFromEnd = true
        }
        binding.rvChatMessages.adapter = adapter

        binding.btnSend.setOnClickListener {
            val text = binding.etChatInput.text.toString().trim()
            if (text.isNotEmpty()) {
                viewModel.sendMessage(text)
                binding.etChatInput.setText("")
            }
        }

        viewModel.messages.observe(viewLifecycleOwner) { messages ->
            adapter.updateMessages(messages.toList())
            if (messages.isNotEmpty()) {
                binding.rvChatMessages.smoothScrollToPosition(messages.size - 1)
            }
        }

        viewModel.suggestions.observe(viewLifecycleOwner) { suggestions ->
            binding.layoutSuggestions.removeAllViews()
            suggestions.forEach { s ->
                val chip = Chip(requireContext()).apply {
                    text = "${s.icon} ${s.text}"
                    setOnClickListener {
                        viewModel.sendMessage(s.text)
                    }
                }
                binding.layoutSuggestions.addView(chip)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class ChatAdapter(
        private var messages: List<ChatMessage>
    ) : RecyclerView.Adapter<ChatAdapter.ViewHolder>() {

        fun updateMessages(newMessages: List<ChatMessage>) {
            messages = newMessages
            notifyDataSetChanged()
        }

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val layoutAssistant: LinearLayout = view.findViewById(R.id.layout_assistant_bubble)
            val tvAssistant: TextView = view.findViewById(R.id.tv_assistant_message)
            val layoutUser: LinearLayout = view.findViewById(R.id.layout_user_bubble)
            val tvUser: TextView = view.findViewById(R.id.tv_user_message)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_chat_message, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val msg = messages[position]
            if (msg.isUser) {
                holder.layoutUser.visibility = View.VISIBLE
                holder.layoutAssistant.visibility = View.GONE
                holder.tvUser.text = msg.text
            } else {
                holder.layoutAssistant.visibility = View.VISIBLE
                holder.layoutUser.visibility = View.GONE
                holder.tvAssistant.text = msg.text
            }
        }

        override fun getItemCount(): Int = messages.size
    }
}
