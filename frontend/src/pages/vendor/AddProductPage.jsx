import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct, clearCreateError } from "../../features/products/productsSlice";
import VariantRow from "../../components/vendor/VariantRow";

const emptyVariant = () => ({ label: "", sku: "", price: "", stock: "", imageFile: null });

function AddProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createStatus, createError } = useSelector((state) => state.products);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    basePrice: "",
    stock: "",
    isPublished: false,
  });
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState([emptyVariant()]);
  const [productImages, setProductImages] = useState([]); // File[]

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
    next[index] = { ...next[index], imageFile: file };
    setVariants(next);
  };

  const addVariantRow = () => setVariants([...variants, emptyVariant()]);
  const removeVariantRow = (index) => setVariants(variants.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearCreateError());

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("basePrice", form.basePrice);
    formData.append("isPublished", form.isPublished);

    if (useVariants) {
      // Backend matches variantImages files to variants missing an
      // imageUrl, in array order — so every variant here must either
      // all have an image or none, to keep that alignment simple.
      const variantsPayload = variants.map(({ label, sku, price, stock }) => ({
        label,
        sku,
        price,
        stock,
      }));
      formData.append("variants", JSON.stringify(variantsPayload));
      variants.forEach((v) => {
        if (v.imageFile) formData.append("variantImages", v.imageFile);
      });
    } else {
      formData.append("stock", form.stock);
    }

    productImages.forEach((file) => formData.append("images", file));

    const result = await dispatch(createProduct(formData));
    if (createProduct.fulfilled.match(result)) {
      navigate("/vendor/products");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {createError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {createError}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category ID
            </label>
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

        {/* Product images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product images (up to 6)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setProductImages(Array.from(e.target.files).slice(0, 6))}
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
                If you're adding variant images, add one for every variant — mixing
                variants with and without images isn't supported yet.
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
            disabled={createStatus === "loading"}
            className="bg-blue-600 text-white rounded px-5 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {createStatus === "loading" ? "Saving..." : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/vendor/products")}
            className="text-gray-600 px-5 py-2 font-medium hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductPage;
