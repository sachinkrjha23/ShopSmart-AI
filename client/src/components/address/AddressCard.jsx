import Button from '../ui/Button'

const AddressCard = ({ address, onSetDefault, onEdit, onDelete, disabled }) => {
  return (
    <div
      className={`p-5 border rounded-xl bg-white ${
        address.is_default ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-800">{address.full_name}</span>
        {address.is_default && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        {address.address}, {address.city}, {address.state} - {address.pincode}
        <br />
        {address.country}
      </p>
      <p className="text-sm text-gray-500 mt-2">{address.phone}</p>

      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        {!address.is_default && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            disabled={disabled}
            className="text-indigo-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set as Default
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(address)}
          disabled={disabled}
          className="text-gray-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit
        </button>
        {!address.is_default && (
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={disabled}
            className="text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default AddressCard