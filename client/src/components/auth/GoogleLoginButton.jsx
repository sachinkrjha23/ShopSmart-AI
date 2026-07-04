import { useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { googleLogin, googleSignup } from '../../store/slices/authSlice'
import { toast } from 'react-hot-toast'

let googleScriptPromise = null

const loadGoogleScript = () => {
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

const GoogleLoginButton = ({ mode = 'login', onSuccess }) => {
  const dispatch = useDispatch()
  const buttonRef = useRef(null)
  const hasRenderedRef = useRef(false)

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) return

      try {
        if (mode === 'signup') {
          await dispatch(googleSignup({ credential: response.credential })).unwrap()
          toast.success('Account created with Google!')
        } else {
          await dispatch(googleLogin({ credential: response.credential })).unwrap()
          toast.success('Logged in with Google!')
        }
        onSuccess?.()
      } catch (err) {
        toast.error(err || 'Google authentication failed')
      }
    },
    [dispatch, mode, onSuccess],
  )

  useEffect(() => {
    let cancelled = false

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !buttonRef.current || hasRenderedRef.current) return
        hasRenderedRef.current = true

        buttonRef.current.innerHTML = ''

        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
        })
      })
      .catch((err) => console.error('Google Sign-In failed to load:', err))

    return () => {
      cancelled = true
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [handleCredentialResponse, mode])

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  )
}

export default GoogleLoginButton