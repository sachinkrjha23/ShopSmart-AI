import { useState } from 'react'
import { useSelector } from 'react-redux'
import SellerSidebar from './SellerSidebar'
import SellerNavbar from './SellerNavbar'

const SellerLayout = ({ children }) => {
  const { mySeller } = useSelector((state) => state.seller)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerNavbar storeName={mySeller?.store_name} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default SellerLayout