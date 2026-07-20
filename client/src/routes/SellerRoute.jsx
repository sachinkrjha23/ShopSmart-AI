import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { fetchMySellerProfile } from '../store/slices/sellerSlice'
import Loader from '../components/ui/Loader'
import SellerLayout from '../components/seller/SellerLayout'

const SellerRoute = ({ children }) => {
  const dispatch = useDispatch()
  const { isAuthenticated, sessionChecked } = useSelector((state) => state.auth)
  const { mySeller, mySellerChecked } = useSelector((state) => state.seller)

  useEffect(() => {
    if (sessionChecked && isAuthenticated && !mySellerChecked) {
      dispatch(fetchMySellerProfile())
    }
  }, [sessionChecked, isAuthenticated, mySellerChecked, dispatch])

  if (!sessionChecked) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) return <Navigate to="/" replace />

  if (!mySellerChecked) {
    return <Loader fullScreen />
  }

  if (mySeller?.status !== 'Approved') return <Navigate to="/become-seller" replace />

  return <SellerLayout>{children}</SellerLayout>
}

export default SellerRoute