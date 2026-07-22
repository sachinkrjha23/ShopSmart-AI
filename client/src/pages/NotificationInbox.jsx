import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInboxNotifications, markNotificationRead, dismissNotification } from '../store/slices/notificationSlice'
import Loader from '../components/ui/Loader'

const NotificationInbox = () => {
  const dispatch = useDispatch()
  const { inboxNotifications: notifications, loading } = useSelector((state) => state.notification)
  const [showRead, setShowRead] = useState(false)

  useEffect(() => {
    dispatch(fetchInboxNotifications(showRead ? { includeRead: true } : {}))
  }, [dispatch, showRead])

  if (loading && notifications.length === 0) {
    return <Loader fullScreen />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <div className="flex gap-2 text-sm font-medium">
          <button
            onClick={() => setShowRead(false)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${!showRead ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Unread
          </button>
          <button
            onClick={() => setShowRead(true)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${showRead ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-400 text-center py-16">
          {showRead ? "No notifications yet." : "You're all caught up."}
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border ${n.read_at ? 'bg-white border-gray-100' : 'bg-indigo-50 border-indigo-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {!n.read_at && (
                    <button
                      onClick={() => dispatch(markNotificationRead(n.id))}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => dispatch(dismissNotification(n.id))}
                    className="text-xs font-medium text-gray-400 hover:text-red-500 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationInbox