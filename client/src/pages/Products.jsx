// src/pages/Products.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  fetchProducts,
  setCurrentPage,
  setFilters,
} from "../store/slices/productSlice";
import ProductGrid from "../components/product/ProductGrid";
import ProductFilters from "../components/product/ProductFilters";
import Pagination from "../components/ui/Pagination";

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { products, loading, pagination, filters } = useSelector(
    (state) => state.product,
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ✅ Sync incoming URL params (?category=, ?ratings=, ?search=) into Redux filters.
  // Full override (not merge) — landing via a category link should show only that
  // category, not stacked on top of whatever was left in Redux from a prior visit.
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const ratingsParam = searchParams.get("ratings");
    const searchParam = searchParams.get("search");

    if (categoryParam || ratingsParam || searchParam) {
      dispatch(
        setFilters({
          category: categoryParam || "",
          rating: ratingsParam || "",
          search: searchParam || "",
          minPrice: "",
          maxPrice: "",
          availability: "",
          sort: "",
        }),
      );
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    // Build params matching exactly what backend accepts
    const params = {};

    if (filters.category) params.category = filters.category;
    if (filters.rating) params.ratings = filters.rating;
    if (filters.availability) params.availability = filters.availability;
    if (filters.minPrice && filters.maxPrice) {
      params.price = `${filters.minPrice}-${filters.maxPrice}`;
    }
    params.page = pagination.currentPage;

    dispatch(fetchProducts(params));
  }, [filters, pagination.currentPage, dispatch]);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Count active filters
  const activeFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.rating) count++;
    if (filters.availability) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Products
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.totalProducts} product
              {pagination.totalProducts !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
              Filters
              {activeFilterCount() > 0 && (
                <span className="ml-1 bg-indigo-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {filters.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {filters.category}
                  <button
                    onClick={() =>
                      dispatch(setFilters({ ...filters, category: "" }))
                    }
                    className="hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.minPrice && filters.maxPrice && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  ₹{filters.minPrice} - ₹{filters.maxPrice}
                  <button
                    onClick={() =>
                      dispatch(
                        setFilters({ ...filters, minPrice: "", maxPrice: "" }),
                      )
                    }
                    className="hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.rating && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {filters.rating}★ & above
                  <button
                    onClick={() =>
                      dispatch(setFilters({ ...filters, rating: "" }))
                    }
                    className="hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.availability && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {filters.availability === "in-stock"
                    ? "In Stock"
                    : filters.availability === "limited"
                      ? "Limited"
                      : "Out of Stock"}
                  <button
                    onClick={() =>
                      dispatch(setFilters({ ...filters, availability: "" }))
                    }
                    className="hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <ProductGrid products={products} loading={loading} />

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

      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ProductFilters onClose={() => setIsFilterDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Products;
