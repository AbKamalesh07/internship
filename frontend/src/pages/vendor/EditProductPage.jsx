import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchMyProducts,
  updateProduct,
  clearUpdateError,
} from "../../features/products/productsSlice";
import ProductForm from "../../components/vendor/ProductForm";

function EditProductPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, updateStatus, updateError } = useSelector((state) => state.products);
  const product = items.find((p) => p._id === id);

  // If the vendor navigates straight to an edit URL (e.g. page refresh)
  // the list may not be loaded yet — fetch it once if so.
  useEffect(() => {
    if (items.length === 0 && status === "idle") {
      dispatch(fetchMyProducts());
    }
  }, [dispatch, items.length, status]);

  const handleSubmit = async (formData) => {
    dispatch(clearUpdateError());
    const result = await dispatch(updateProduct({ id, formData }));
    if (updateProduct.fulfilled.match(result)) {
      navigate("/vendor/products");
    }
  };

  if (status === "loading" && !product) {
    return <p className="text-gray-500">Loading product...</p>;
  }

  if (!product) {
    return (
      <div>
        <p className="text-gray-500 mb-2">
          That product couldn't be found in your store.
        </p>
        <Link to="/vendor/products" className="text-blue-600 hover:underline text-sm">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h1>
      <ProductForm
        mode="edit"
        product={product}
        status={updateStatus}
        error={updateError}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/vendor/products")}
      />
    </div>
  );
}

export default EditProductPage;
