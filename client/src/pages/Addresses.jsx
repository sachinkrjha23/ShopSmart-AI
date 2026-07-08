import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAddresses, setDefaultAddress, removeAddress } from '../store/slices/addressSlice'
import AddressCard from '../components/address/AddressCard'
import AddressModal from '../components/address/AddressModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'

const Addresses = () => {
  const dispatch = useDispatch()
  const { addresses, loading } = useSelector((state) => state.address)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  useEffect(() => {
    dispatch(fetchAddresses())
  }, [dispatch])

  const handleAddNew = () => {
    setEditingAddress(null)
    setModalOpen(true)
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setModalOpen(true)
  }

  const handleSetDefault = async (id) => {
    try {
      await dispatch(setDefaultAddress(id)).unwrap()
      toast.success('Default address updated')
    } catch (err) {
      toast.error(err || 'Failed to set default address')
    }
  }

  const handleDeleteConfirm = async () => {
    const id = deleteTargetId
    setDeleteTargetId(null)
    try {
      await dispatch(removeAddress(id)).unwrap()
      toast.success('Address deleted')
    } catch (err) {
      toast.error(err || 'Failed to delete address')
    }
  }

  if (loading && addresses.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
        {addresses.length < 5 && (
          <Button onClick={handleAddNew}>+ Add New Address</Button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 mb-4">You haven't saved any addresses yet.</p>
          <Button onClick={handleAddNew}>Add Your First Address</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={handleSetDefault}
              onEdit={handleEdit}
              onDelete={setDeleteTargetId}
              disabled={loading}
            />
          ))}
        </div>
      )}

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        addressId={editingAddress?.id || null}
        initialData={editingAddress}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        message="Are you sure you want to delete this address? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

export default Addresses