import { useSelector } from 'react-redux'
import SellerSidebar from './SellerSidebar'
import SellerNavbar from './SellerNavbar'

const SellerLayout = ({ children }) => {
  const { mySeller } = useSelector((state) => state.seller)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerNavbar storeName={mySeller?.store_name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default SellerLayout