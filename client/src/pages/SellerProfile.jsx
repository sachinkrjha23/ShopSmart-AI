import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPublicSellerProfile,
  clearPublicSellerProfile,
} from "../store/slices/sellerSlice";
import { fetchProducts, clearProducts } from "../store/slices/productSlice";
import ProductGrid from "../components/product/ProductGrid";
import Pagination from "../components/ui/Pagination";
import Loader from "../components/ui/Loader";
import Button from "../components/ui/Button";
import ReportButton from "../components/report/ReportButton";

const SellerProfile = () => {
  const { sellerId } = useParams();
  const dispatch = useDispatch();
  const {
    publicSellerProfile: seller,
    loading: sellerLoading,
    error,
  } = useSelector((state) => state.seller);
  const {
    products,
    pagination,
    loading: productsLoading,
  } = useSelector((state) => state.product);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPublicSellerProfile(sellerId));
    return () => {
      dispatch(clearPublicSellerProfile());
      dispatch(clearProducts());
    };
  }, [dispatch, sellerId]);

  useEffect(() => {
    setPage(1);
  }, [sellerId]);

  useEffect(() => {
    if (seller) {
      dispatch(fetchProducts({ sellerId, page }));
    }
  }, [dispatch, sellerId, page, seller]);

  if (sellerLoading && !seller) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Seller not found
        </h1>
        <p className="text-gray-500 mb-6">
          {error || "This seller doesn't exist or isn't currently active."}
        </p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold shrink-0">
          {seller.store_name?.[0]?.toUpperCase() || "S"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {seller.store_name}
          </h1>

          {seller.rating_count > 0 ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-sm font-medium text-gray-800">
                {seller.avg_rating}
              </span>
              <span className="text-xs text-gray-400">
                ({seller.rating_count}{" "}
                {seller.rating_count === 1 ? "rating" : "ratings"})
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
          )}

          <p className="text-xs text-gray-400 mt-1">
            Member since{" "}
            {new Date(seller.created_at).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </p>
          {seller.description && (
            <p className="text-sm text-gray-600 mt-3 max-w-2xl">
              {seller.description}
            </p>
          )}
          <div className="mt-3">
            <ReportButton entityType="seller" entityId={sellerId} label="Report this seller" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Products from {seller.store_name}
        </h2>
        <ProductGrid
          products={products}
          loading={productsLoading}
          columns={4}
        />
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;
