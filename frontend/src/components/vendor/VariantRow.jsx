// One row per product variant (e.g. "Size: M / Color: Blue"). Kept as a
// small presentational component so both AddProductPage and the future
// EditProductPage can reuse it.
function VariantRow({ variant, index, onChange, onRemove, onImageChange }) {
  const handleField = (field) => (e) => {
    onChange(index, { ...variant, [field]: e.target.value });
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-start border border-gray-200 rounded p-3">
      <div className="col-span-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
        <input
          value={variant.label}
          onChange={handleField("label")}
          placeholder="Size: M / Blue"
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
        <input
          value={variant.sku}
          onChange={handleField("sku")}
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={variant.price}
          onChange={handleField("price")}
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
        <input
          type="number"
          min="0"
          value={variant.stock}
          onChange={handleField("stock")}
          required
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(index, e.target.files[0] || null)}
          className="w-full text-xs"
        />
      </div>
      <div className="col-span-1 flex items-end justify-end h-full">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 text-sm mt-5"
          title="Remove variant"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default VariantRow;
