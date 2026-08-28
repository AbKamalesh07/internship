import { useState } from "react";
import VariantRow from "./VariantRow";

const emptyVariant = () => ({
  label: "",
  sku: "",
  price: "",
  stock: "",
  imageUrl: "", // existing Cloudinary URL, kept as-is unless replaced
  imageFile: null, // new file picked to replace imageUrl
});

// Builds the initial form state either from scratch (create) or from an
// existing product (edit) — this is what lets one component serve both pages.
const buildInitialState = (product) => {
  if (!product) {
    return {
      form: {
        name: "",
        category: "",
        description: "",
        basePrice: "",
        stock: "",
        isPublished: false,
      },
      useVariants: false,
      variants: [emptyVariant()],
      existingImages: [],
    };
  }

  const hasVariants = product.variants?.length > 0;
  return {
    form: {
      name: product.name || "",
      category: product.category?._id || product.category || "",
      description: product.description || "",
      basePrice: product.basePrice ?? "",
      stock: hasVariants ? "" : product.stock ?? 0,
      isPublished: !!product.isPublished,
    },
    useVariants: hasVariants,
    variants: hasVariants
      ? product.variants.map((v) => ({
          label: v.label,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          imageUrl: v.imageUrl || "",
          imageFile: null,
        }))
      : [emptyVariant()],
    existingImages: product.images || [],
  };
};

// mode: "create" | "edit". onSubmit receives the built FormData.
function ProductForm({ mode, product, status, error, onSubmit, onCancel }) {
  const initial = buildInitialState(product);

  const [form, setForm] = useState(initial.form);
  const [useVariants, setUseVariants] = useState(initial.useVariants);
  const [variants, setVariants] = useState(initial.variants);
  const [existingImages, setExistingImages] = useState(initial.existingImages);
  const [newImages, setNewImages] = useState([]); // File[]

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleVariantChange = (index, updated) => {
    const next = [...variants];
    next[index] = updated;
    setVariants(next);
  };

  const handleVariantImageChange = (index, file) => {
    const next = [...variants];
    // Picking a replacement clears imageUrl so the backend assigns the
    // new upload instead of leaving the old one in place.
    next[index] = { ...next[index], imageFile: file, imageUrl: file ? "" : next[index].imageUrl };
    setVariants(next);
  };

  const addVariantRow = () => setVariants([...variants, emptyVariant()]);
  const removeVariantRow = (index) => setVariants(variants.filter((_, i) => i !== index));

  const removeExistingImage = (url) => {
    setExistingImages(existingImages.filter((img) => img !== url));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("basePrice", form.basePrice);
    formData.append("isPublished", form.isPublished);

    if (useVariants) {
      // Variants that already have an imageUrl are sent as-is (backend
      // leaves them untouched); variants with imageUrl cleared are
      // matched, in array order, to the variantImages files below.
      const variantsPayload = variants.map(({ label, sku, price, stock, imageUrl }) => ({
        label,
        sku,
        price,
        stock,
        imageUrl: imageUrl || undefined,
      }));
      formData.append("variants", JSON.stringify(variantsPayload));
      variants.forEach((v) => {
        if (v.imageFile) formData.append("variantImages", v.imageFile);
      });
    } else {
      formData.append("stock", form.stock);
    }

    // Existing images the vendor kept are re-sent as a JSON text field
    // (same field name as the file uploads below) so the backend can
    // merge kept + newly uploaded instead of wiping the gallery.
    formData.append("images", JSON.stringify(existingImages));
    newImages.forEach((file) => formData.append("images", file));

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleFormChange}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
          <input
            name="category"
            value={form.category}
            onChange={handleFormChange}
            required
            placeholder="Mongo ObjectId"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-400 mt-1">
            Category management UI isn't built yet — paste a Category _id for now.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="basePrice"
            value={form.basePrice}
            onChange={handleFormChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Existing images (edit mode only) */}
      {existingImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current images</label>
          <div className="flex gap-3 flex-wrap">
            {existingImages.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-16 h-16 rounded object-cover border border-gray-200" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs leading-5"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New product images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {existingImages.length > 0 ? "Add more images" : "Product images"} (up to 6 total)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewImages(Array.from(e.target.files).slice(0, 6))}
          className="w-full text-sm"
        />
      </div>

      {/* Variants toggle */}
      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={useVariants}
            onChange={(e) => setUseVariants(e.target.checked)}
          />
          This product has variants (size, color, etc.)
        </label>

        {!useVariants && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              name="stock"
              value={form.stock}
              onChange={handleFormChange}
              required
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-2"
            />
          </div>
        )}

        {useVariants && (
          <div className="mt-4 space-y-3">
            {variants.map((variant, index) => (
              <VariantRow
                key={index}
                variant={variant}
                index={index}
                onChange={handleVariantChange}
                onRemove={removeVariantRow}
                onImageChange={handleVariantImageChange}
              />
            ))}
            <button
              type="button"
              onClick={addVariantRow}
              className="text-blue-600 hover:underline text-sm"
            >
              + Add another variant
            </button>
            <p className="text-xs text-gray-400">
              If you're adding images for new/changed variants, add one for every
              variant that needs one — mixing variants with and without a new image
              in the same save isn't supported yet.
            </p>
          </div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="isPublished"
            checked={form.isPublished}
            onChange={handleFormChange}
          />
          Publish immediately (otherwise saved as a draft)
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-blue-600 text-white rounded px-5 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "loading"
            ? "Saving..."
            : mode === "edit"
            ? "Save Changes"
            : "Save Product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 px-5 py-2 font-medium hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
