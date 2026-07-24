import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerReturns, resolveSellerReturn } from "../../store/slices/returnSlice";
import ReturnRequestList from "../../components/returns/ReturnRequestList";

const SellerReturns = () => {
  const dispatch = useDispatch();
  const { sellerReturns, sellerReturnsLoading } = useSelector((state) => state.returns);
  const [activeTab, setActiveTab] = useState("Pending");

  useEffect(() => {
    dispatch(fetchSellerReturns({ status: activeTab === "All" ? "" : activeTab }));
  }, [dispatch, activeTab]);

  const handleResolve = (returnId, action, admin_notes) =>
    dispatch(resolveSellerReturn({ returnId, action, admin_notes })).unwrap();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Returns for your own products only.</p>
      </div>
      <ReturnRequestList
        returns={sellerReturns}
        loading={sellerReturnsLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResolve={handleResolve}
      />
    </div>
  );
};

export default SellerReturns;