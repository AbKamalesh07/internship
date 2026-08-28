import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProduct } from "../../features/products/productsSlice";

// Lets a vendor bump a product's stock count directly from the table row,
// without opening the full edit form. Only meaningful for products
// without variants — a variant product's stock is derived from its
// variants (see Product model), so quantity edits for those happen in
// the full edit form instead.
function QuickStockEditor({ product }) {
  const dispatch = useDispatch();
  const { updateStatus } = useSelector((state) => state.products);
  const [value, setValue] = useState(product.stock ?? product.totalStock ?? 0);
  const [editing, setEditing] = useState(false);
  const isSaving = editing && updateStatus === "loading";

  const hasVariants = product.variants && product.variants.length > 0;

  if (hasVariants) {
    return <span className="text-gray-600">{product.totalStock} (via variants)</span>;
  }

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("stock", value);
    const result = await dispatch(updateProduct({ id: product._id, formData }));
    if (updateProduct.fulfilled.match(result)) {
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-gray-700 hover:text-blue-600 underline decoration-dotted"
        title="Click to update stock"
      >
        {product.totalStock}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-sm"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
      >
        {isSaving ? "..." : "Save"}
      </button>
      <button
        onClick={() => {
          setEditing(false);
          setValue(product.stock ?? product.totalStock ?? 0);
        }}
        className="text-gray-400 hover:text-gray-600 text-xs"
      >
        Cancel
      </button>
    </div>
  );
}

export default QuickStockEditor;
