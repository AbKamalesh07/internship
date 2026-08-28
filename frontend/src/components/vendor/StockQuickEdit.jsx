import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateProduct } from "../../features/products/productsSlice";

// Renders a plain number for variant products (their stock is derived
// from variants — editing it here wouldn't mean anything; use the full
// edit form to change variant stock instead). For simple products, lets
// the vendor bump stock up/down without opening the full edit form.
function StockQuickEdit({ product }) {
  const dispatch = useDispatch();
  const isVariantProduct = product.variants?.length > 0;

  const [value, setValue] = useState(product.stock ?? product.totalStock ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (isVariantProduct) {
    return <span className="text-gray-600">{product.totalStock}</span>;
  }

  const dirty = Number(value) !== Number(product.stock ?? product.totalStock ?? 0);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const formData = new FormData();
    formData.append("stock", value);
    const result = await dispatch(updateProduct({ id: product._id, formData }));
    setSaving(false);
    if (updateProduct.fulfilled.match(result)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
      />
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      )}
      {saved && <span className="text-xs text-green-600">Saved</span>}
    </div>
  );
}

export default StockQuickEdit;
