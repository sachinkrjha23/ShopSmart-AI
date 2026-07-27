// src/components/home/AISearchBar.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import {
  fetchAIRecommendations,
  clearAIProducts,
} from "../../store/slices/productSlice";
import { openLoginModal } from "../../store/slices/uiSlice";
import ProductGrid from "../product/ProductGrid";

const AISearchBar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { aiProducts, aiLoading } = useSelector((state) => state.product);
  const [prompt, setPrompt] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!prompt.trim() || prompt.trim().length < 2) {
      return toast.error(
        "Please describe what you're looking for in more detail"
      );
    }

    if (!isAuthenticated) {
      toast.error("Please login to use AI search");
      dispatch(openLoginModal());
      return;
    }

    setHasSearched(true);

    try {
      await dispatch(fetchAIRecommendations(prompt.trim())).unwrap();
    } catch (error) {
      toast.error(error || "AI search failed. Please try again.");
    }
  };

  const handleClear = () => {
    setPrompt("");
    setHasSearched(false);
    dispatch(clearAIProducts());
  };

  return (
    <section id="ai-search" className="py-16 sm:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 mb-4">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-teal-600">Powered by Gemini AI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Tell us what you're looking for
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Describe it in your own words — "a lightweight laptop bag under ₹2000" — and let AI find it for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. wireless headphones for the gym"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base min-w-[140px]"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                'Ask AI'
              )}
            </button>
          </form>

          {hasSearched && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {aiLoading ? "Finding products for you..." : `Results for "${prompt}"`}
                </h3>
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear results
                </button>
              </div>

              {!aiLoading && aiProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products matched that description. Try rephrasing your search.</p>
                </div>
              ) : (
                <ProductGrid products={aiProducts} loading={aiLoading} />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AISearchBar;