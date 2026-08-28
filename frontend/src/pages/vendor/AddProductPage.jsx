import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct, clearCreateError } from "../../features/products/productsSlice";
import ProductForm from "../../components/vendor/ProductForm";

function AddProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createStatus, createError } = useSelector((state) => state.products);

  const handleSubmit = async (formData) => {
    dispatch(clearCreateError());
    const result = await dispatch(createProduct(formData));
    if (createProduct.fulfilled.match(result)) {
      navigate("/vendor/products");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Product</h1>
      <ProductForm
        mode="create"
        status={createStatus}
        error={createError}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/vendor/products")}
      />
    </div>
  );
}

export default AddProductPage;
