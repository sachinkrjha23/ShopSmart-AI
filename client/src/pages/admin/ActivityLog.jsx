import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivityLog } from "../../store/slices/adminSlice";
import TableSkeleton from "../../components/ui/TableSkeleton";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import { toast } from "react-hot-toast";
import Tooltip from "../../components/ui/Tooltip";

const ACTION_LABELS = {
  seller_approved: { label: "Seller Approved", variant: "success" },
  seller_rejected: { label: "Seller Rejected", variant: "danger" },
  seller_suspended: { label: "Seller Suspended", variant: "warning" },
  return_approved: { label: "Return Approved", variant: "success" },
  return_rejected: { label: "Return Rejected", variant: "danger" },
  order_status_updated: { label: "Order Status Updated", variant: "info" },
  item_fulfillment_updated: {
    label: "Item Fulfillment Updated",
    variant: "info",
  },
  order_refunded: { label: "Order Refunded", variant: "warning" },
  order_cancelled: { label: "Order Cancelled", variant: "danger" },
  review_deleted: { label: "Review Deleted", variant: "danger" },
  contact_message_deleted: { label: "Message Deleted", variant: "danger" },
  user_deleted: { label: "User Deleted", variant: "danger" },
  product_deactivated: { label: "Product Deactivated", variant: "warning" },
  product_reactivated: { label: "Product Reactivated", variant: "success" },
  report_resolved: { label: "Report Resolved", variant: "info" },
};

const ENTITY_TYPES = [
  "seller",
  "return",
  "order",
  "order_item",
  "review",
  "contact_message",
  "user",
  "product",
  "report",
];

const ActivityLog = () => {
  const dispatch = useDispatch();
  const { activityLogs, totalActivityLogs, activityLogPage, loading } =
    useSelector((state) => state.admin);
  const [filters, setFilters] = useState({
    actionType: "",
    entityType: "",
    fromDate: "",
    toDate: "",
  });
  const [expandedId, setExpandedId] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const totalPages = Math.max(1, Math.ceil(totalActivityLogs / 15));

  const load = (page = 1) => {
    const params = { page };
    if (filters.actionType) params.actionType = filters.actionType;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    dispatch(fetchActivityLog(params));

  };

  useEffect(() => {
    load(1);
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilters = () => load(1);

  const clearFilters = () => {
    setFilters({ actionType: "", entityType: "", fromDate: "", toDate: "" });
    dispatch(fetchActivityLog({ page: 1 }));
  };
  
  const handleCopyEntityId = (entityId) => {
    navigator.clipboard.writeText(entityId);
    toast.success("Entity ID copied to clipboard.");
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Action Type</label>
          <select
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Entity Type</label>
          <select
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="">All entities</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            max={today}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">To</label>
          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            max={today}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {loading && activityLogs.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : activityLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No activity found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => {
                const meta = ACTION_LABELS[log.action_type] || {
                  label: log.action_type,
                  variant: "default",
                };
                const isOpen = expandedId === log.id;
                return (
                  <>
                    <tr
                      key={log.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="px-4 py-3">
                        <Badge label={meta.label} variant={meta.variant} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.entity_type}
                        {log.entity_id && (
                          <Tooltip text={log.entity_id}>
                            <button
                              type="button"
                              onClick={() => handleCopyEntityId(log.entity_id)}
                              className="block text-xs text-gray-400 hover:text-teal-600 transition-colors"
                            >
                              {log.entity_id.slice(0, 8)}...
                            </button>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.admin_name ? (
                          <>
                            {log.admin_name}
                            <span className="block text-xs text-gray-400">
                              {log.admin_email}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">
                            Deleted admin
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.details && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isOpen ? null : log.id)
                            }
                            className="text-teal-600 hover:underline text-xs"
                          >
                            {isOpen ? "Hide" : "View"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr
                        key={`${log.id}-details`}
                        className="border-t border-gray-50 bg-gray-50"
                      >
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={activityLogPage}
        totalPages={totalPages}
        onPageChange={load}
      />
    </div>
  );
};

export default ActivityLog;
