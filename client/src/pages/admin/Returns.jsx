import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminReturns, resolveAdminReturn, retryAdminRefund } from "../../store/slices/returnSlice";
import ReturnRequestList from "../../components/returns/ReturnRequestList";

const AdminReturns = () => {
  const dispatch = useDispatch();
  const { adminReturns, adminReturnsLoading } = useSelector((state) => state.returns);
  const [activeTab, setActiveTab] = useState("Pending");

  useEffect(() => {
    dispatch(fetchAdminReturns({ status: activeTab === "All" ? "" : activeTab }));
  }, [dispatch, activeTab]);

  const handleResolve = (returnId, action, admin_notes) =>
    dispatch(resolveAdminReturn({ returnId, action, admin_notes })).unwrap();

  const handleRetryRefund = (returnId) =>
    dispatch(retryAdminRefund(returnId)).unwrap();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Admin-owned item returns only — marketplace seller returns are handled by the seller.</p>
      </div>
      <ReturnRequestList
        returns={adminReturns}
        loading={adminReturnsLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResolve={handleResolve}
        onRetryRefund={handleRetryRefund}
      />
    </div>
  );
};

export default AdminReturns;