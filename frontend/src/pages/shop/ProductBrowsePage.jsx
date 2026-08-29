import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import api from "../../api/axios";
import { addItem, openCartDrawer } from "../../features/cart/cartSlice";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const hasVariants = product.variants?.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState(
    hasVariants ? product.variants[0]._id : null
  );

  const selectedVariant = hasVariants
    ? product.variants.find((v) => v._id === selectedVariantId)
    : null;

  const price = selectedVariant ? selectedVariant.price : product.basePrice;
  const stock = selectedVariant ? selectedVariant.stock : product.totalStock;
  const outOfStock = stock <= 0;

  const handleAddToCart = () => {
    dispatch(
      addItem({
        productId: product._id,
        variantId: selectedVariant ? selectedVariant._id : null,
        name: product.name,
        variantLabel: selectedVariant ? selectedVariant.label : null,
        price,
        image: selectedVariant?.imageUrl || product.images?.[0] || null,
        storeId: product.store?._id,
        storeName: product.store?.name,
        maxStock: stock,
        quantity: 1,
      })
    );
    dispatch(openCartDrawer());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {product.images?.[0] ? (
        <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-100" />
      )}

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gray-400 mb-1">{product.store?.name}</p>
        <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
        <p className="text-sm font-semibold text-gray-800 mb-2">${price?.toFixed(2)}</p>

        {hasVariants && (
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm mb-2"
          >
            {product.variants.map((v) => (
              <option key={v._id} value={v._id}>
                {v.label} {v.stock <= 0 ? "(out of stock)" : ""}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-auto bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Out of stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

function ProductBrowsePage() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | succeeded | failed
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus("loading");
    api
      .get("/products")
      .then((res) => {
        setProducts(res.data.products);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load products");
        setStatus("failed");
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shop</h1>

      {status === "loading" && <p className="text-gray-500">Loading products...</p>}
      {status === "failed" && <p className="text-red-600">{error}</p>}
      {status === "succeeded" && products.length === 0 && (
        <p className="text-gray-500">No products published yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductBrowsePage;
