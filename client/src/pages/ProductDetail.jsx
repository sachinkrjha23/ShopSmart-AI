import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { fetchProduct, clearSingleProduct } from "../store/slices/productSlice";
import StarRating from "../components/ui/StarRating";
import Breadcrumb from "../components/ui/Breadcrumb";
import Loader from "../components/ui/Loader";
import ReviewCard from "../components/product/ReviewCard";
import useCart from "../hooks/useCart";
import WishlistButton from "../components/wishlist/WishlistButton";

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { singleProduct: product, loading } = useSelector(
    (state) => state.product,
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem, decreaseQuantity, getItemQuantity } = useCart();

  const cartQuantity = getItemQuantity(id);

  useEffect(() => {
    dispatch(fetchProduct(id));
    return () => dispatch(clearSingleProduct());
  }, [id, dispatch]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  const handleAddToCart = () => {
    if (!isInStock) return toast.error("Product is out of stock");
    addItem(product);
  };

  const handleDecrease = () => {
    decreaseQuantity(id);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) return <Loader fullScreen />;

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Product not found
        </h2>
        <Link
          to="/products"
          className="text-indigo-600 hover:underline text-sm"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const isInStock = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;
  const cartCap = Math.min(product.stock ?? 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: product.name },
            ]}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Images */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.url}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    No image available
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? "border-indigo-500"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-5">
              <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
                {product.category}
              </span>

              <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <StarRating rating={product.ratings || 0} size="md" />
                <span className="text-sm text-gray-500">
                  {Number(product.ratings).toFixed(1)} ·{" "}
                  {product.reviews?.length || 0} reviews
                </span>
              </div>

              <div className="text-3xl font-bold text-indigo-600">
                {formatPrice(product.price)}
              </div>

              <div>
                {!isInStock && (
                  <span className="text-sm font-medium text-red-500">
                    Out of Stock
                  </span>
                )}
                {isLowStock && (
                  <span className="text-sm font-medium text-yellow-600">
                    Only {product.stock} left in stock
                  </span>
                )}
                {isInStock && !isLowStock && (
                  <span className="text-sm font-medium text-green-600">
                    In Stock
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>

              <hr className="border-gray-100" />

              <div className="flex gap-3 mt-2">
                {cartQuantity > 0 ? (
                  <div className="flex-1 flex items-center justify-between border border-gray-200 rounded-xl px-2 py-1">
                    <button
                      onClick={handleDecrease}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg rounded-lg"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-gray-800">
                      {cartQuantity} in cart
                    </span>
                    <button
                      onClick={handleAddToCart}
                      disabled={cartQuantity >= cartCap}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg rounded-lg"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className="flex-1 bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isInStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                )}

                <WishlistButton productId={id} variant="button" />
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Customer Reviews ({product.reviews?.length || 0})
            </h2>

            {product.reviews?.length === 0 && (
              <p className="text-sm text-gray-500">
                No reviews yet. Be the first to review this product.
              </p>
            )}

            {product.reviews?.length > 0 && (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <ReviewCard key={review.review_id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;