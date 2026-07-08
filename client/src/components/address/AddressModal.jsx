import Modal from '../ui/Modal'
import AddressForm from '../checkout/AddressForm'

const AddressModal = ({ isOpen, onClose, addressId = null, initialData = null }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={addressId ? 'Edit Address' : 'Add New Address'}
      size="md"
    >
      <AddressForm
        addressId={addressId}
        initialData={initialData}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </Modal>
  )
}

export default AddressModal