package com.bodypilot.app.ui.nutrition

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bodypilot.app.R
import com.bodypilot.app.data.models.ShoppingItemDto
import com.bodypilot.app.databinding.FragmentShoppingListBinding

class ShoppingListFragment : Fragment() {

    private var _binding: FragmentShoppingListBinding? = null
    private val binding get() = _binding!!
    private val viewModel: NutritionViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentShoppingListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvShoppingItems.layoutManager = LinearLayoutManager(requireContext())

        viewModel.shoppingList.observe(viewLifecycleOwner) { items ->
            binding.rvShoppingItems.adapter = ShoppingAdapter(items)
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.loadShoppingList()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    class ShoppingAdapter(
        private val items: List<ShoppingItemDto>
    ) : RecyclerView.Adapter<ShoppingAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val cbItem: CheckBox = view.findViewById(R.id.cb_shopping_item)
            val tvQty: TextView = view.findViewById(R.id.tv_shopping_item_qty)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_shopping, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = items[position]
            holder.cbItem.text = item.name.capitalize()
            holder.cbItem.isChecked = item.checked
            holder.tvQty.text = "${item.quantity.toInt()} ${item.unit}"

            holder.cbItem.setOnCheckedChangeListener { _, isChecked ->
                item.checked = isChecked
            }
        }

        override fun getItemCount(): Int = items.size
    }
}
