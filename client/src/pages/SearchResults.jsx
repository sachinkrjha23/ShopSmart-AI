import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, setCurrentPage } from "../store/slices/productSlice";
import ProductGrid from "../components/product/ProductGrid";
import Pagination from "../components/ui/Pagination";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const dispatch = useDispatch();
  const { products, loading, pagination } = useSelector(
    (state) => state.product,
  );

  useEffect(() => {
    dispatch(setCurrentPage(1));
  }, [query]);

  useEffect(() => {
    if (query.trim()) {
      dispatch(
        fetchProducts({ search: query.trim(), page: pagination.currentPage }),
      );
    }
  }, [query, pagination.currentPage, dispatch]);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-gray-700">
          No search query provided
        </h2>
        <Link
          to="/products"
          className="text-indigo-600 hover:underline text-sm"
        >
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Search results for{" "}
            <span className="text-indigo-600">"{query}"</span>
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">
              {pagination.totalProducts} product
              {pagination.totalProducts !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Results */}
        <ProductGrid products={products} loading={loading} />

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
