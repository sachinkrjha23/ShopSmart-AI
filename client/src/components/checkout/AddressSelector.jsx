import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchAddresses,
  selectAddress,
  setDefaultAddress,
  removeAddress,
} from "../../store/slices/addressSlice";
import AddressForm from "./AddressForm";

const AddressSelector = () => {
  const dispatch = useDispatch();
  const { addresses, selectedAddress, loading } = useSelector(
    (state) => state.address,
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleSelect = (address) => {
    dispatch(selectAddress(address));
  };

  const handleSetDefault = (e, id) => {
    e.stopPropagation();
    dispatch(setDefaultAddress(id));
  };

  const handleEdit = (e, address) => {
    e.stopPropagation();
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await dispatch(removeAddress(id)).unwrap();
      toast.success("Address deleted");
    } catch (err) {
      toast.error(err || "Failed to delete address");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const editingAddress = editingId
    ? addresses.find((a) => a.id === editingId)
    : null;

  if (loading && addresses.length === 0) {
    return <p className="text-sm text-gray-500">Loading addresses...</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Delivery Address
      </h2>

      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 mb-3">No saved addresses yet.</p>
      )}

      {!showForm && addresses.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => handleSelect(addr)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAddress?.id === addr.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {addr.full_name}
                    </span>
                    {addr.is_default && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">
                    {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-gray-500 mt-1">{addr.phone}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-2 text-xs">
                {!addr.is_default && (
                  <button
                    onClick={(e) => handleSetDefault(e, addr.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={(e) => handleEdit(e, addr)}
                  className="text-gray-500 hover:underline"
                >
                  Edit
                </button>
                {!addr.is_default && (
                  <button
                    onClick={(e) => handleDelete(e, addr.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <AddressForm
          addressId={editingId}
          initialData={editingAddress}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      ) : (
        addresses.length < 5 && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            + Add New Address
          </button>
        )
      )}
    </div>
  );
};

export default AddressSelector;
