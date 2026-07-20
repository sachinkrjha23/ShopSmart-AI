const SellerNavbar = ({ storeName }) => {
  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6">
      {storeName && <span className="text-sm text-gray-400">{storeName}</span>}
    </div>
  )
}

export default SellerNavbar